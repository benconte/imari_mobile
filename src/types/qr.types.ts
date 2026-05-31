/**
 * Imari QR types.
 * Used by useQR hook and the QR scan/show screens.
 */

export interface QRPayload {
  walletNumber: string
  name: string
  currency: string
  /** Optional — fixed-amount QR codes pre-fill the transfer amount */
  amount?: number
}

export type QRScanResult =
  | { valid: true; payload: QRPayload }
  | { valid: false; error: 'INVALID_FORMAT' | 'WRONG_APP' | 'EXPIRED' }

export interface DeepLinkPayload {
  screen: 'transfer' | 'receive' | 'vault' | 'transaction'
  params: Record<string, string>
}
