/**
 * useSavings — vault list + create mutation.
 * useVault — vault detail, contribution history, contribute/withdraw/close mutations.
 *
 * Backend endpoints (not yet implemented — falls back to mock):
 * Backend endpoints:
 *   GET  /savings/vaults
 *   GET  /savings/vaults/:id
 *   GET  /savings/rules?walletId=...
 *   POST /savings/vaults
 *   POST /savings/vaults/:id/deposit     ← contribute
 *   POST /savings/vaults/:id/withdraw
 *   DELETE /savings/vaults/:id           ← close vault
 *   PATCH /savings/rules/:id/toggle
 *
 * NOTE: No per-vault contributions endpoint — contributions are sourced
 * from transaction history (VAULT_CONTRIBUTION type) or mock.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type {
  SavingsVault,
  CreateVaultPayload,
  VaultContribution,
  ContributePayload,
  SavingsRule,
  WithdrawPayload,
} from '../types/savings.types'
import {
  mockVaults,
  mockContributions,
  mockRules,
} from '../lib/mocks/savings.mock'

// Env-driven flag: set EXPO_PUBLIC_USE_MOCK=true to use mock data
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true'

// ─── API response shape ───────────────────────────────────────────────────────

interface ApiResponse<T> {
  data: T
}

// Backend returns Decimal fields as strings — normalize to numbers
function normalizeVault(v: Record<string, unknown>): SavingsVault {
  console.log(v.targetAmount);
  console.log(v.currentAmount);

  return {
    ...(v as unknown as SavingsVault),
    targetAmount: Number(v.targetAmount),
    currentAmount: Number(v.currentAmount),
  }
}

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiFetchVaults(): Promise<SavingsVault[]> {
  const res = await api.get<ApiResponse<SavingsVault[]>>('/savings/vaults')
  const raw = res.data.data ?? []
  return raw.map((v: any) => normalizeVault(v))
}

async function apiFetchVault(id: string): Promise<SavingsVault> {
  const res = await api.get<ApiResponse<SavingsVault>>(`/savings/vaults/${id}`)
  return normalizeVault(res.data.data as unknown as Record<string, unknown>)
}

async function apiFetchRules(walletId: string): Promise<SavingsRule[]> {
  const res = await api.get<ApiResponse<SavingsRule[]>>('/savings/rules', {
    params: { walletId },
  })
  const raw = res.data.data ?? []
  return raw.map((r) => ({
    ...r,
    amount: r.amount !== null ? Number(r.amount) : null,
  }))
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
      // Backend expects targetAmount as string
      const body = {
        walletId: payload.walletId,
        name: payload.name,
        description: payload.description,
        targetAmount: String(payload.targetAmount),
        currency: payload.currency,
        targetDate: payload.targetDate
          ? new Date(payload.targetDate).toISOString()
          : undefined,
        iconEmoji: payload.iconEmoji,
      }
      const res = await api.post<ApiResponse<SavingsVault>>('/savings/vaults', body)
      return normalizeVault(res.data.data as unknown as Record<string, unknown>)
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

  // Contributions: no dedicated endpoint — use mock or fetch from tx history
  const { data: contributions = [], isLoading: isLoadingContributions } = useQuery<VaultContribution[], Error>({
    queryKey: ['vault', id, 'contributions'],
    queryFn: () => Promise.resolve(
      USE_MOCK
        ? mockContributions.filter((c) => c.vaultId === id)
        : [] // No backend contributions endpoint — show empty until implemented
    ),
    enabled: Boolean(id),
    staleTime: 30_000,
  })

  // Rules: fetch from GET /savings/rules?walletId=... once vault is loaded
  const walletId = vault?.walletId
  const { data: rules = [] } = useQuery<SavingsRule[], Error>({
    queryKey: ['vault', id, 'rules'],
    queryFn: USE_MOCK
      ? () => Promise.resolve(mockRules)
      : () => apiFetchRules(walletId!),
    enabled: Boolean(id) && Boolean(walletId),
    staleTime: 60_000,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['vault', id] })
    queryClient.invalidateQueries({ queryKey: ['savings'] })
    queryClient.invalidateQueries({ queryKey: ['wallet', 'dashboard'] })
  }

  // Contribute — real endpoint is POST /savings/vaults/:id/deposit
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
      // Backend expects amount as string, does not support note, requires currency
      console.log("payload:", payload.currency);

      await api.post(`/savings/vaults/${id}/deposit`, {
        amount: String(payload.amount),
        currency: payload.currency || 'RWF',
      })
      // Return a synthetic contribution record
      return {
        id: `con_${Date.now()}`,
        vaultId: id,
        amount: payload.amount,
        note: payload.note ?? null,
        isAuto: false,
        createdAt: new Date().toISOString(),
      }
    },
    onSuccess: invalidate,
  })

  const withdrawMutation = useMutation<void, Error, WithdrawPayload>({
    mutationFn: async (payload) => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 800))
        return
      }
      await api.post(`/savings/vaults/${id}/withdraw`, {
        amount: String(payload.amount),
        currency: payload.currency || 'RWF',
      })
    },
    onSuccess: invalidate,
  })

  // Close vault — real endpoint is DELETE /savings/vaults/:id
  const closeMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 800))
        return
      }
      await api.delete(`/savings/vaults/${id}`)
    },
    onSuccess: invalidate,
  })

  // Toggle rule — real endpoint is PATCH /savings/rules/:id/toggle
  const toggleRuleMutation = useMutation<void, Error, string>({
    mutationFn: async (ruleId) => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 300))
        return
      }
      await api.patch(`/savings/rules/${ruleId}/toggle`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault', id, 'rules'] })
    },
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
