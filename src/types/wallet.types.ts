/**
 * Imari wallet types.
 * Locked: do not change keys without updating all consumers.
 */

import type { Transaction } from './transaction.types'

export interface Wallet {
  id: string
  walletNumber: string
  currency: string
  balance: number
  availableBalance: number
  lockedBalance?: number
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED'
  isPrimary: boolean
  isLocked?: boolean
  dailyLimit?: number
  monthlyLimit?: number
  createdAt: string
  updatedAt?: string
}

export interface WalletDashboard {
  primaryWallet: Wallet
  allWallets: Wallet[]
  recentTransactions: Transaction[]
  financialHealthScore: number | null
  totalSaved: number
  activeVaultsCount: number
}

export interface CreateWalletPayload {
  currency: string
}

export type WalletAction =
  | 'FUND'
  | 'SET_PRIMARY'
  | 'SET_PIN'
  | 'CHANGE_PIN'
  | 'FREEZE'
  | 'UNFREEZE'
  | 'RENAME'
  | 'CLOSE'
