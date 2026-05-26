/**
 * useWallet — fetches wallet dashboard data via TanStack Query.
 * Balance visibility and selected wallet ID persisted in MMKV
 * (with graceful in-memory fallback if JSI is not available).
 */

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Wallet, WalletDashboard } from '../types/wallet.types'
import type { Transaction } from '../types/transaction.types'
import { mockDashboard } from '../lib/mocks/wallet.mock'

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true'

// MMKV keys
const MMKV_BALANCE_VISIBLE = 'imari_balance_visible'
const MMKV_SELECTED_WALLET = 'imari_selected_wallet'

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
  try {
    mmkv?.set(key, value ? 'true' : 'false')
  } catch {
    // ignore
  }
}

function mmkvGetString(key: string, defaultValue: string): string {
  if (!mmkv) return defaultValue
  try {
    return mmkv.getString(key) ?? defaultValue
  } catch {
    return defaultValue
  }
}

function mmkvSetString(key: string, value: string): void {
  try {
    mmkv?.set(key, value)
  } catch {
    // ignore
  }
}

async function fetchDashboard(): Promise<WalletDashboard> {
  const response = await api.get<{ success: boolean; data: WalletDashboard }>('/wallet/dashboard')
  return response.data.data
}

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
  toggleBalanceVisibility: () => void
  selectedWalletId: string
  selectWallet: (walletId: string) => void
  refetch: () => void
}

export function useWallet(): UseWalletReturn {
  const [isBalanceVisible, setIsBalanceVisible] = useState(() =>
    mmkvGetBool(MMKV_BALANCE_VISIBLE, true),
  )
  const [selectedWalletId, setSelectedWalletId] = useState(() =>
    mmkvGetString(MMKV_SELECTED_WALLET, ''),
  )

  const { data, isLoading, error, refetch } = useQuery<WalletDashboard, Error>({
    queryKey: ['wallet', 'dashboard'],
    queryFn: USE_MOCK ? () => Promise.resolve(mockDashboard) : fetchDashboard,
    retry: 1,
  })

  // Set default selected wallet when data loads
  const primaryId = data?.primaryWallet?.id ?? ''
  const resolvedSelectedId = selectedWalletId || primaryId

  const toggleBalanceVisibility = useCallback(() => {
    setIsBalanceVisible((prev) => {
      const next = !prev
      mmkvSetBool(MMKV_BALANCE_VISIBLE, next)
      return next
    })
  }, [])

  const selectWallet = useCallback((walletId: string) => {
    setSelectedWalletId(walletId)
    mmkvSetString(MMKV_SELECTED_WALLET, walletId)
  }, [])

  // Derive selected wallet from allWallets
  const allWallets = data?.allWallets ?? []
  const wallet =
    allWallets.find((w) => w.id === resolvedSelectedId) ?? data?.primaryWallet

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
    toggleBalanceVisibility,
    selectedWalletId: resolvedSelectedId,
    selectWallet,
    refetch,
  }
}
