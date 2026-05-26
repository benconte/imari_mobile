/**
 * Mock data for transfer flow — used when backend resolve endpoint is unavailable.
 */

import type { ResolvedRecipient, TransferResult } from '../../types/transfer.types'

export const mockResolvedRecipient: ResolvedRecipient = {
  walletNumber: 'IMR-7465291357',
  name: 'Jean Pierre Habimana',
  currency: 'RWF',
}

export function mockResolveByWalletNumber(walletNumber: string): ResolvedRecipient {
  return {
    walletNumber,
    name: 'Unknown Recipient',
    currency: 'RWF',
  }
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
