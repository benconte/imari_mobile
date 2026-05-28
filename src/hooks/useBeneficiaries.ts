/**
 * useBeneficiaries — saved transfer recipients.
 *
 * Backend endpoints:
 *   GET    /beneficiaries/recent?limit=10  → Beneficiary[]
 *   POST   /beneficiaries                  → Beneficiary (create or upsert)
 *   DELETE /beneficiaries/:id              → void
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Beneficiary } from '../types/transfer.types'

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true'

// ─── Mock data ───────────────────────────────────────────────────────────────

const mockBeneficiaries: Beneficiary[] = []

// ─── API helpers ─────────────────────────────────────────────────────────────

interface ApiResponse<T> {
  data: T
}

async function apiFetchRecent(limit = 10): Promise<Beneficiary[]> {
  const res = await api.get<ApiResponse<Beneficiary[]>>('/beneficiaries/recent', {
    params: { limit },
  })
  return res.data.data ?? []
}

export interface SaveBeneficiaryPayload {
  displayName: string
  imariWalletNumber: string
  imariUserId?: string
  phone?: string
}

async function apiSaveBeneficiary(payload: SaveBeneficiaryPayload): Promise<Beneficiary> {
  const res = await api.post<ApiResponse<Beneficiary>>('/beneficiaries', payload)
  return res.data.data
}

async function apiRemoveBeneficiary(id: string): Promise<void> {
  await api.delete(`/beneficiaries/${id}`)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseBeneficiariesReturn {
  beneficiaries: Beneficiary[]
  isLoading: boolean
  refetch: () => void
  saveBeneficiary: (payload: SaveBeneficiaryPayload) => Promise<Beneficiary>
  isSaving: boolean
  removeBeneficiary: (id: string) => Promise<void>
  isRemoving: boolean
}

export function useBeneficiaries(limit = 10): UseBeneficiariesReturn {
  const queryClient = useQueryClient()

  const { data: beneficiaries = [], isLoading, refetch } = useQuery<Beneficiary[], Error>({
    queryKey: ['beneficiaries', 'recent'],
    queryFn: USE_MOCK
      ? () => Promise.resolve(mockBeneficiaries)
      : () => apiFetchRecent(limit),
    staleTime: 60_000,
  })

  const saveMutation = useMutation<Beneficiary, Error, SaveBeneficiaryPayload>({
    mutationFn: async (payload) => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 300))
        return {
          id: `ben_${Date.now()}`,
          displayName: payload.displayName,
          imariWalletNumber: payload.imariWalletNumber,
          phone: payload.phone ?? null,
          lastUsedAt: new Date().toISOString(),
          isFavorite: false,
        }
      }
      return apiSaveBeneficiary(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] })
    },
  })

  const removeMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 300))
        return
      }
      return apiRemoveBeneficiary(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] })
    },
  })

  return {
    beneficiaries,
    isLoading,
    refetch,
    saveBeneficiary: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    removeBeneficiary: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
  }
}
