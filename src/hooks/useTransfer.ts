/**
 * useTransfer — P2P transfer hook.
 *
 * initiate: calls POST /wallet/transfer (real backend endpoint)
 * resolveRecipient: mock only — backend resolve endpoint not yet available.
 *
 * On success: invalidates ['wallet', 'dashboard'] and ['transactions'] so
 * the home screen balance and transaction list refresh automatically.
 */

import { useState, useCallback, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { mockResolveByWalletNumber, mockTransferResult } from '../lib/mocks/transfer.mock'
import type { TransferPayload, TransferResult, ResolvedRecipient } from '../types/transfer.types'

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK !== 'false'

// ─── API ──────────────────────────────────────────────────────────────────────

async function apiTransfer(payload: TransferPayload): Promise<TransferResult> {
  const { data } = await api.post<{ success: boolean; data: TransferResult }>(
    '/wallet/transfer',
    payload,
  )
  return data.data
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseTransferReturn {
  initiate: (payload: TransferPayload) => Promise<TransferResult>
  isLoading: boolean
  error: string | null
  result: TransferResult | null
  reset: () => void

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
      // Invalidate so home balance + transaction list refresh
      queryClient.invalidateQueries({ queryKey: ['wallet', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
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
      const res = await mutation.mutateAsync(payload)
      return res
    },
    [mutation],
  )

  // Mock resolve — debounced 500ms. Replaces with real API when endpoint exists.
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
        // TODO: replace with GET /wallet/resolve?walletNumber=... when backend adds it
        await new Promise((r) => setTimeout(r, 300))
        setResolvedRecipient(mockResolveByWalletNumber(walletNumber))
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

  return {
    initiate,
    isLoading: mutation.isPending,
    error,
    result,
    reset,
    resolveRecipient,
    isResolving,
    resolvedRecipient,
  }
}
