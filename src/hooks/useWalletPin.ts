/**
 * useWalletPin — set and change the user's wallet transaction PIN.
 * Backend: POST /wallet/pin (setup) | PUT /wallet/pin (change)
 * PIN is user-scoped (one PIN per user, not per-wallet), 4 digits.
 */

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true'

interface UseWalletPinReturn {
  setupPin: (pin: string) => Promise<void>
  changePin: (oldPin: string, newPin: string) => Promise<void>
  isLoading: boolean
  error: string | null
  clearError: () => void
}

export function useWalletPin(): UseWalletPinReturn {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const setupMutation = useMutation<void, Error, { pin: string }>({
    mutationFn: async ({ pin }) => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 800))
        return
      }
      await api.post('/wallet/pin', { pin })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      setError(null)
    },
    onError: (err) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Failed to set PIN. Please try again.'
      setError(msg)
    },
  })

  const changeMutation = useMutation<void, Error, { oldPin: string; newPin: string }>({
    mutationFn: async ({ oldPin, newPin }) => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 800))
        return
      }
      await api.put('/wallet/pin', { oldPin, newPin })
    },
    onSuccess: () => {
      setError(null)
    },
    onError: (err) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Failed to change PIN. Please try again.'
      setError(msg)
    },
  })

  const isLoading = setupMutation.isPending || changeMutation.isPending

  return {
    setupPin: (pin: string) => setupMutation.mutateAsync({ pin }),
    changePin: (oldPin: string, newPin: string) =>
      changeMutation.mutateAsync({ oldPin, newPin }),
    isLoading,
    error,
    clearError: () => setError(null),
  }
}
