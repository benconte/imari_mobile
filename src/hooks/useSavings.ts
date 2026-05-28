/**
 * useSavings — vault list + create mutation.
 * useVault — vault detail, contribution history, contribute/withdraw/close mutations.
 *
 * Backend endpoints (not yet implemented — falls back to mock):
 *   GET  /savings/vaults
 *   GET  /savings/vaults/:id
 *   GET  /savings/vaults/:id/contributions
 *   POST /savings/vaults
 *   POST /savings/vaults/:id/contribute
 *   POST /savings/vaults/:id/withdraw
 *   POST /savings/vaults/:id/close
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type {
  SavingsVault,
  VaultContribution,
  SavingsRule,
  CreateVaultPayload,
  ContributePayload,
} from '../types/savings.types'
import {
  mockVaults,
  mockContributions,
  mockRules,
} from '../lib/mocks/savings.mock'

// Savings backend not yet implemented — always use mock for now
const USE_MOCK = true

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiFetchVaults(): Promise<SavingsVault[]> {
  const res = await api.get<{ data: SavingsVault[] }>('/savings/vaults')
  return res.data.data
}

async function apiFetchVault(id: string): Promise<SavingsVault> {
  const res = await api.get<{ data: SavingsVault }>(`/savings/vaults/${id}`)
  return res.data.data
}

async function apiFetchContributions(id: string): Promise<VaultContribution[]> {
  const res = await api.get<{ data: VaultContribution[] }>(
    `/savings/vaults/${id}/contributions`,
    { params: { page: 1, limit: 20 } },
  )
  return res.data.data
}

// ─── useSavings ───────────────────────────────────────────────────────────────

export function useSavings() {
  const queryClient = useQueryClient()

  const { data: vaults = [], isLoading, refetch } = useQuery<SavingsVault[], Error>({
    queryKey: ['savings'],
    queryFn: USE_MOCK ? () => Promise.resolve(mockVaults) : apiFetchVaults,
    staleTime: 30_000,
  })

  const totalSaved = vaults
    .filter((v) => v.status !== 'CANCELLED')
    .reduce((sum, v) => sum + v.currentAmount, 0)

  const createMutation = useMutation<SavingsVault, Error, CreateVaultPayload>({
    mutationFn: async (payload) => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 800))
        const newVault: SavingsVault = {
          id: `vault_${Date.now()}`,
          walletId: payload.walletId,
          name: payload.name,
          description: payload.description ?? null,
          targetAmount: payload.targetAmount,
          currentAmount: 0,
          currency: payload.currency,
          status: payload.isLocked ? 'LOCKED' : 'ACTIVE',
          isLocked: payload.isLocked,
          lockUntil: payload.lockUntil ?? null,
          targetDate: payload.targetDate ?? null,
          iconEmoji: payload.iconEmoji ?? '💰',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        return newVault
      }
      const res = await api.post<{ data: SavingsVault }>('/savings/vaults', payload)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] })
      queryClient.invalidateQueries({ queryKey: ['wallet', 'dashboard'] })
    },
  })

  return {
    vaults,
    totalSaved,
    isLoading,
    refetch,
    createVault: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}

// ─── useVault ─────────────────────────────────────────────────────────────────

export function useVault(id: string) {
  const queryClient = useQueryClient()

  const { data: vault, isLoading: isLoadingVault, refetch } = useQuery<SavingsVault, Error>({
    queryKey: ['vault', id],
    queryFn: USE_MOCK
      ? () => Promise.resolve(mockVaults.find((v) => v.id === id) ?? mockVaults[0])
      : () => apiFetchVault(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  })

  const { data: contributions = [], isLoading: isLoadingContributions } = useQuery<VaultContribution[], Error>({
    queryKey: ['vault', id, 'contributions'],
    queryFn: USE_MOCK
      ? () => Promise.resolve(mockContributions.filter((c) => c.vaultId === id))
      : () => apiFetchContributions(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  })

  const { data: rules = [] } = useQuery<SavingsRule[], Error>({
    queryKey: ['vault', id, 'rules'],
    queryFn: () => Promise.resolve(mockRules),  // Rules endpoint TBD
    enabled: Boolean(id),
    staleTime: 60_000,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['vault', id] })
    queryClient.invalidateQueries({ queryKey: ['savings'] })
    queryClient.invalidateQueries({ queryKey: ['wallet', 'dashboard'] })
  }

  const contributeMutation = useMutation<VaultContribution, Error, ContributePayload>({
    mutationFn: async (payload) => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 800))
        return {
          id: `con_${Date.now()}`,
          vaultId: id,
          amount: payload.amount,
          note: payload.note ?? null,
          isAuto: false,
          createdAt: new Date().toISOString(),
        }
      }
      const res = await api.post<{ data: VaultContribution }>(
        `/savings/vaults/${id}/contribute`,
        payload,
      )
      return res.data.data
    },
    onSuccess: invalidate,
  })

  const withdrawMutation = useMutation<void, Error, number>({
    mutationFn: async (amount) => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 800))
        return
      }
      await api.post(`/savings/vaults/${id}/withdraw`, { amount })
    },
    onSuccess: invalidate,
  })

  const closeMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 800))
        return
      }
      await api.post(`/savings/vaults/${id}/close`)
    },
    onSuccess: invalidate,
  })

  return {
    vault,
    contributions,
    rules,
    isLoading: isLoadingVault || isLoadingContributions,
    refetch,
    contribute: contributeMutation.mutateAsync,
    isContributing: contributeMutation.isPending,
    withdraw: withdrawMutation.mutateAsync,
    isWithdrawing: withdrawMutation.isPending,
    closeVault: closeMutation.mutateAsync,
    isClosing: closeMutation.isPending,
  }
}
