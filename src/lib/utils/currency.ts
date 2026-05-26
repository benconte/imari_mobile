/**
 * Currency formatting utilities.
 * Handles RWF, USD, and any ISO 4217 currency code.
 */

import type { TransactionDirection } from '../../types/transaction.types'

/**
 * Format amount with currency code.
 * formatCurrency(5000, 'RWF') → 'RWF 5,000'
 * formatCurrency(1250.50, 'USD') → 'USD 1,250.50'
 */
export function formatCurrency(amount: number, currency: string): string {
  // RWF has no decimal places by convention
  const fractionDigits = currency === 'RWF' ? 0 : 2
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
  return `${currency} ${formatted}`
}

/**
 * Format with sign for transaction display.
 * formatTransactionAmount(5000, 'RWF', 'DEBIT')  → '-RWF 5,000'
 * formatTransactionAmount(5000, 'RWF', 'CREDIT') → '+RWF 5,000'
 */
export function formatTransactionAmount(
  amount: number,
  currency: string,
  direction: TransactionDirection,
): string {
  const sign = direction === 'CREDIT' ? '+' : '-'
  return `${sign}${formatCurrency(amount, currency)}`
}

/**
 * Mask balance for show/hide toggle.
 * maskBalance() → '•••••••'
 */
export function maskBalance(): string {
  return '•••••••'
}

/**
 * Truncate wallet number to masked format.
 * truncateWalletNumber('4000 0000 0000 4821') → '**** 4821'
 */
export function truncateWalletNumber(walletNumber: string): string {
  const clean = walletNumber.replace(/\s/g, '')
  const last4 = clean.slice(-4)
  return `**** ${last4}`
}
