/**
 * useTransfer — P2P transfer hook.
 *
 * initiate: calls POST /wallet/transfer
 * resolveRecipient: calls GET /wallet/transfer/lookup?walletNumber=...
 *   - Debounced 500ms to avoid API spam while typing
 *   - Falls back to mock when EXPO_PUBLIC_USE_MOCK=true
 *
 * On success: invalidates ['wallet', 'dashboard'] and ['transactions'] so
 * the home screen balance and transaction list refresh automatically.
 * Also auto-saves the recipient as a beneficiary.
 */

import { useState, useCallback, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { mockResolveByWalletNumber, mockTransferResult } from '../lib/mocks/transfer.mock'
import type { TransferPayload, TransferResult, ResolvedRecipient } from '../types/transfer.types'

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true'

// ─── API ──────────────────────────────────────────────────────────────────────

async function apiTransfer(payload: TransferPayload): Promise<TransferResult> {
  const { data } = await api.post<{ success: boolean; data: TransferResult }>(
    '/wallet/transfer',
    payload,
  )
  return data.data
}

interface LookupResponse {
  walletId: string
  walletNumber: string
  currency: string
  displayName: string | null
  maskedEmail: string | null
  maskedPhone: string | null
  fingerprint: string
}

async function apiLookupRecipient(walletNumber: string): Promise<ResolvedRecipient> {
  const { data } = await api.get<{ data: LookupResponse }>(
    '/wallet/transfer/lookup',
    { params: { walletNumber } },
  )
  const raw = data.data
  return {
    ...raw,
    // convenience alias for UI components
    name: raw.displayName ?? raw.walletNumber,
  }
}

async function apiSaveBeneficiary(recipient: ResolvedRecipient): Promise<void> {
  try {
    await api.post('/beneficiaries', {
      displayName: recipient.name,
      imariWalletNumber: recipient.walletNumber,
    })
  } catch {
    // Non-critical — silently ignore if save fails
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseTransferReturn {
  initiate: (payload: TransferPayload) => Promise<TransferResult>
  isLoading: boolean
  error: string | null
  result: TransferResult | null
  reset: () => void
  clearError: () => void

  resolveRecipient: (walletNumber: string) => void
  isResolving: boolean
  resolvedRecipient: ResolvedRecipient | null
}

export function useTransfer(): UseTransferReturn {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TransferResult | null>(null)
  const [resolvedRecipient, setResolvedRecipient] = useState<ResolvedRecipient | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const mutation = useMutation<TransferResult, Error, TransferPayload>({
    mutationFn: USE_MOCK
      ? async (payload) => {
          await new Promise((r) => setTimeout(r, 1200))
          return { ...mockTransferResult, amount: payload.amount, currency: payload.currency }
        }
      : apiTransfer,
    onSuccess: (data) => {
      setResult(data)
      setError(null)
      // Auto-save recipient as beneficiary (non-blocking)
      if (resolvedRecipient && !USE_MOCK) {
        apiSaveBeneficiary(resolvedRecipient)
      }
      // Invalidate so home balance + transaction list + beneficiaries refresh
      queryClient.invalidateQueries({ queryKey: ['wallet', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] })
    },
    onError: (err) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        err.message ??
        'Transfer failed'
      setError(message)
    },
  })

  const initiate = useCallback(
    async (payload: TransferPayload): Promise<TransferResult> => {
      setError(null)
      // Pass fingerprint for extra validation if available
      const enrichedPayload: TransferPayload = {
        ...payload,
        recipientFingerprint: resolvedRecipient?.fingerprint,
      }
      const res = await mutation.mutateAsync(enrichedPayload)
      return res
    },
    [mutation, resolvedRecipient],
  )

  // Debounced lookup — calls real GET /wallet/transfer/lookup or mock
  const resolveRecipient = useCallback((walletNumber: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const isValid = /^IMR-\d{10}$/.test(walletNumber)
    if (!isValid) {
      setResolvedRecipient(null)
      return
    }

    setIsResolving(true)
    debounceRef.current = setTimeout(async () => {
      try {
        if (USE_MOCK) {
          await new Promise((r) => setTimeout(r, 300))
          setResolvedRecipient(mockResolveByWalletNumber(walletNumber))
        } else {
          const recipient = await apiLookupRecipient(walletNumber)
          setResolvedRecipient(recipient)
        }
      } catch {
        // Recipient not found or network error — clear resolved state
        setResolvedRecipient(null)
      } finally {
        setIsResolving(false)
      }
    }, 500)
  }, [])

  const reset = useCallback(() => {
    setError(null)
    setResult(null)
    setResolvedRecipient(null)
    mutation.reset()
  }, [mutation])

  const clearError = useCallback(() => setError(null), [])

  return {
    initiate,
    isLoading: mutation.isPending,
    error,
    result,
    reset,
    clearError,
    resolveRecipient,
    isResolving,
    resolvedRecipient,
  }
}
