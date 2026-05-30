/**
 * useWallet — fetches wallet data via TanStack Query.
 * Primary source: GET /wallet/me (all user wallets).
 * Dashboard data (health score, savings) composed client-side from mock
 * until backend adds a dedicated dashboard endpoint.
 *
 * Balance visibility and selected wallet ID persisted in MMKV
 * (with graceful in-memory fallback if JSI is not available).
 */

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Wallet, WalletDashboard, CreateWalletPayload } from '../types/wallet.types'
import type { Transaction } from '../types/transaction.types'
import { mockDashboard, mockMultipleWallets } from '../lib/mocks/wallet.mock'

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true'

// MMKV keys
const MMKV_BALANCE_VISIBLE = 'imari_balance_visible'
const MMKV_SELECTED_WALLET = 'imari_selected_wallet'
const MMKV_LAST_UNLOCKED = 'imari_last_unlocked_time'

// Lazy MMKV import with fallback — MMKV requires JSI (dev build only)
type MMKVInstance = {
  getString: (k: string) => string | undefined
  set: (k: string, v: string | boolean) => void
}
let mmkv: MMKVInstance | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const { MMKV } = require('react-native-mmkv') as { MMKV: new () => MMKVInstance }
  mmkv = new MMKV()
} catch {
  // Expo Go / web — MMKV unavailable, fall back to in-memory
}

function mmkvGetBool(key: string, defaultValue: boolean): boolean {
  if (!mmkv) return defaultValue
  try {
    const val = mmkv.getString(key)
    if (val === undefined) return defaultValue
    return val === 'true'
  } catch {
    return defaultValue
  }
}

function mmkvSetBool(key: string, value: boolean): void {
  try { mmkv?.set(key, value ? 'true' : 'false') } catch { /* ignore */ }
}

function mmkvGetString(key: string, defaultValue: string): string {
  if (!mmkv) return defaultValue
  try { return mmkv.getString(key) ?? defaultValue } catch { return defaultValue }
}

function mmkvSetString(key: string, value: string): void {
  try { mmkv?.set(key, value) } catch { /* ignore */ }
}

// ─── API helpers ─────────────────────────────────────────────────────────────

async function fetchWallets(): Promise<Wallet[]> {
  const response = await api.get<{ success: boolean; data: Wallet[] }>('/wallet/me')
  // Backend returns balance as string (Prisma Decimal) — normalise to number
  return (response.data.data ?? []).map((w) => ({
    ...w,
    balance: Number(w.balance),
    availableBalance: Number(w.availableBalance),
  }))
}

async function fetchRecentTransactions(): Promise<Transaction[]> {
  const response = await api.get<{ data: Transaction[] }>('/wallet/transactions', {
    params: { limit: 5 },
  })
  return response.data.data ?? []
}

// Fetch savings stats from /savings/vaults
async function fetchSavingsStats(): Promise<{ totalSaved: number; activeVaultsCount: number }> {
  try {
    const response = await api.get<{ data: Array<{ currentAmount: string | number; status: string }> }>('/savings/vaults')
    const vaults = response.data.data ?? []
    const active = vaults.filter((v) => v.status !== 'CANCELLED')
    const totalSaved = active.reduce((sum, v) => sum + Number(v.currentAmount), 0)
    return { totalSaved, activeVaultsCount: active.length }
  } catch {
    return { totalSaved: 0, activeVaultsCount: 0 }
  }
}

// Build dashboard from /wallet/me + recent transactions + savings
async function fetchDashboard(): Promise<WalletDashboard> {
  const [wallets, txns, savings] = await Promise.all([
    fetchWallets(),
    fetchRecentTransactions(),
    fetchSavingsStats(),
  ])
  const primary = wallets.find((w) => w.isPrimary) ?? wallets[0]
  return {
    primaryWallet: primary ?? wallets[0],
    allWallets: wallets,
    recentTransactions: txns,
    financialHealthScore: null,
    totalSaved: savings.totalSaved,
    activeVaultsCount: savings.activeVaultsCount,
  }
}

// ─── useWallet hook ───────────────────────────────────────────────────────────

export interface UseWalletReturn {
  wallet: Wallet | undefined
  allWallets: Wallet[]
  isLoadingWallet: boolean
  walletError: Error | null
  recentTransactions: Transaction[]
  isLoadingTransactions: boolean
  financialHealthScore: number | null
  totalSaved: number
  activeVaultsCount: number
  isBalanceVisible: boolean
  hideBalance: () => void
  requestShowBalance: () => boolean
  unlockBalance: () => void
  selectedWalletId: string
  selectWallet: (walletId: string) => void
  refetch: () => void
  createWallet: (payload: CreateWalletPayload) => Promise<Wallet>
  isCreating: boolean
  setPrimaryWallet: (walletId: string) => Promise<void>
  isSettingPrimary: boolean
}

export function useWallet(): UseWalletReturn {
  const queryClient = useQueryClient()

  const [isBalanceVisible, setIsBalanceVisible] = useState(() =>
    mmkvGetBool(MMKV_BALANCE_VISIBLE, false),
  )
  const [selectedWalletId, setSelectedWalletId] = useState(() =>
    mmkvGetString(MMKV_SELECTED_WALLET, ''),
  )

  const { data, isLoading, error, refetch } = useQuery<WalletDashboard, Error>({
    queryKey: ['wallet', 'dashboard'],
    queryFn: USE_MOCK ? () => Promise.resolve(mockDashboard) : fetchDashboard,
    retry: 1,
    staleTime: 30_000,
  })

  const primaryId = data?.primaryWallet?.id ?? ''
  const resolvedSelectedId = selectedWalletId || primaryId

  const hideBalance = useCallback(() => {
    setIsBalanceVisible(false)
    mmkvSetBool(MMKV_BALANCE_VISIBLE, false)
  }, [])

  const requestShowBalance = useCallback(() => {
    const lastUnlockedStr = mmkvGetString(MMKV_LAST_UNLOCKED, '0')
    const lastUnlocked = parseInt(lastUnlockedStr, 10)
    const now = Date.now()
    if (now - lastUnlocked < 5 * 60 * 1000) {
      setIsBalanceVisible(true)
      mmkvSetBool(MMKV_BALANCE_VISIBLE, true)
      return true // unlocked
    }
    return false // pin needed
  }, [])

  const unlockBalance = useCallback(() => {
    mmkvSetString(MMKV_LAST_UNLOCKED, Date.now().toString())
    setIsBalanceVisible(true)
    mmkvSetBool(MMKV_BALANCE_VISIBLE, true)
  }, [])

  const selectWallet = useCallback((walletId: string) => {
    setSelectedWalletId(walletId)
    mmkvSetString(MMKV_SELECTED_WALLET, walletId)
  }, [])

  const allWallets = data?.allWallets ?? []
  const wallet = allWallets.find((w) => w.id === resolvedSelectedId) ?? data?.primaryWallet

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const createMutation = useMutation<Wallet, Error, CreateWalletPayload>({
    mutationFn: async (payload) => {
      if (USE_MOCK) {
        return mockMultipleWallets[1]
      }
      const res = await api.post<{ data: Wallet }>('/wallet', payload)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
  })

  const setPrimaryMutation = useMutation<void, Error, string>({
    mutationFn: async (walletId) => {
      if (USE_MOCK) return
      await api.post('/wallet/set-primary', { walletId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
  })

  return {
    wallet,
    allWallets,
    isLoadingWallet: isLoading,
    walletError: error,
    recentTransactions: data?.recentTransactions ?? [],
    isLoadingTransactions: isLoading,
    financialHealthScore: data?.financialHealthScore ?? null,
    totalSaved: data?.totalSaved ?? 0,
    activeVaultsCount: data?.activeVaultsCount ?? 0,
    isBalanceVisible,
    hideBalance,
    requestShowBalance,
    unlockBalance,
    selectedWalletId: resolvedSelectedId,
    selectWallet,
    refetch,
    createWallet: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    setPrimaryWallet: setPrimaryMutation.mutateAsync,
    isSettingPrimary: setPrimaryMutation.isPending,
  }
}
