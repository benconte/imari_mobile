/**
 * Mock data for transfer flow — used when backend resolve endpoint is unavailable.
 */

import type { ResolvedRecipient, TransferResult } from '../../types/transfer.types'

export const mockResolvedRecipient: ResolvedRecipient = {
  walletNumber: '1234567890',
  name: 'John Doe',
  currency: 'RWF',
} as any

export function mockResolveByWalletNumber(walletNumber: string): ResolvedRecipient {
  return {
    walletNumber: walletNumber,
    name: 'Jane Smith',
    currency: 'RWF',
  } as any
}

export const mockTransferResult: TransferResult = {
  transactionId: 'txn_mock_001',
  reference: 'IMR-2024-ABCD1234',
  amount: '50000',
  currency: 'RWF',
  senderWalletNumber: 'IMR-1234567890',
  receiverWalletNumber: 'IMR-7465291357',
  status: 'COMPLETED',
  processedAt: new Date().toISOString(),
}
