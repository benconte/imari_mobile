/**
 * Savings vault types — Session 5.
 * Locked: do not change keys without updating all consumers.
 */

export interface SavingsVault {
  id: string
  walletId: string
  name: string
  description: string | null
  targetAmount: number
  currentAmount: number
  currency: string
  status: 'ACTIVE' | 'LOCKED' | 'COMPLETED' | 'CANCELLED'
  isLocked: boolean
  lockUntil: string | null
  targetDate: string | null
  iconEmoji: string | null
  createdAt: string
  updatedAt: string
}

export interface VaultContribution {
  id: string
  vaultId: string
  amount: number
  note: string | null
  isAuto: boolean
  createdAt: string
}

export interface SavingsRule {
  id: string
  type: 'ROUND_UP' | 'FIXED_AMOUNT' | 'PERCENTAGE' | 'SCHEDULED'
  amount: number | null
  percentage: number | null
  cronExpression: string | null
  isActive: boolean
}

export interface CreateVaultPayload {
  walletId: string
  name: string
  description?: string
  targetAmount: number
  currency: string
  isLocked: boolean
  lockUntil?: string
  targetDate?: string
  iconEmoji?: string
}

export interface ContributePayload {
  amount: number
  note?: string
}
