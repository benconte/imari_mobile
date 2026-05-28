/**
 * Mock data for savings vaults — used when EXPO_PUBLIC_USE_MOCK=true
 * or when the backend savings endpoints are not yet available.
 */

import type { SavingsVault, VaultContribution, SavingsRule } from '../../types/savings.types'

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86_400_000).toISOString()
}

function daysFromNow(d: number): string {
  return new Date(Date.now() + d * 86_400_000).toISOString()
}

export const mockVaults: SavingsVault[] = [
  {
    id: 'vault_001',
    walletId: 'wlt_001',
    name: 'Emergency Fund',
    description: 'Safety net for unexpected expenses',
    targetAmount: 1_000_000,
    currentAmount: 620_000,
    currency: 'RWF',
    status: 'ACTIVE',
    isLocked: false,
    lockUntil: null,
    targetDate: daysFromNow(180),
    iconEmoji: '💰',
    createdAt: daysAgo(90),
    updatedAt: daysAgo(2),
  },
  {
    id: 'vault_002',
    walletId: 'wlt_001',
    name: 'Vacation to Zanzibar',
    description: 'Summer trip with the family',
    targetAmount: 2_500_000,
    currentAmount: 450_000,
    currency: 'RWF',
    status: 'ACTIVE',
    isLocked: false,
    lockUntil: null,
    targetDate: daysFromNow(300),
    iconEmoji: '✈️',
    createdAt: daysAgo(60),
    updatedAt: daysAgo(5),
  },
  {
    id: 'vault_003',
    walletId: 'wlt_001',
    name: 'New Laptop',
    description: null,
    targetAmount: 800_000,
    currentAmount: 800_000,
    currency: 'RWF',
    status: 'COMPLETED',
    isLocked: true,
    lockUntil: daysFromNow(30),
    targetDate: daysAgo(5),
    iconEmoji: '💻',
    createdAt: daysAgo(120),
    updatedAt: daysAgo(5),
  },
]

export const mockContributions: VaultContribution[] = [
  { id: 'con_001', vaultId: 'vault_001', amount: 50_000, note: 'Monthly savings', isAuto: false, createdAt: daysAgo(2) },
  { id: 'con_002', vaultId: 'vault_001', amount: 20_000, note: null, isAuto: true, createdAt: daysAgo(7) },
  { id: 'con_003', vaultId: 'vault_001', amount: 100_000, note: 'Year-end bonus', isAuto: false, createdAt: daysAgo(14) },
  { id: 'con_004', vaultId: 'vault_001', amount: 30_000, note: null, isAuto: true, createdAt: daysAgo(30) },
  { id: 'con_005', vaultId: 'vault_001', amount: 50_000, note: 'Initial deposit', isAuto: false, createdAt: daysAgo(90) },
  { id: 'con_006', vaultId: 'vault_002', amount: 200_000, note: 'First transfer', isAuto: false, createdAt: daysAgo(60) },
  { id: 'con_007', vaultId: 'vault_002', amount: 100_000, note: null, isAuto: true, createdAt: daysAgo(30) },
  { id: 'con_008', vaultId: 'vault_002', amount: 150_000, note: 'Freelance income', isAuto: false, createdAt: daysAgo(10) },
]

export const mockRules: SavingsRule[] = [
  {
    id: 'rule_001',
    type: 'ROUND_UP',
    amount: null,
    percentage: null,
    cronExpression: null,
    isActive: true,
  },
  {
    id: 'rule_002',
    type: 'FIXED_AMOUNT',
    amount: 20_000,
    percentage: null,
    cronExpression: '0 0 1 * *',
    isActive: false,
  },
]
