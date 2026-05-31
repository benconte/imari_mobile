/**
 * useQR — pure utility hook for QR generation, parsing, and deep link parsing.
 * No API calls — all logic is client-side.
 */

import * as Linking from 'expo-linking'
import type { Wallet } from '../types/wallet.types'
import type { QRPayload, QRScanResult, DeepLinkPayload } from '../types/qr.types'

export function useQR() {
  /**
   * Encode a wallet into a JSON QR string readable by this app.
   * displayName — the account holder's name shown on the result sheet.
   * Optionally include a fixed amount.
   */
  function generateQRValue(wallet: Wallet, displayName: string, amount?: number): string {
    return JSON.stringify({
      appId: 'imari',
      version: 1,
      walletNumber: wallet.walletNumber,
      name: displayName,
      currency: wallet.currency,
      ...(amount != null && amount > 0 ? { amount } : {}),
    })
  }

  /**
   * Parse a raw QR string. Returns valid payload or an error discriminant.
   */
  function parseQR(raw: string): QRScanResult {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      if (parsed.appId !== 'imari') {
        return { valid: false, error: 'WRONG_APP' }
      }
      if (
        typeof parsed.walletNumber !== 'string' ||
        typeof parsed.name !== 'string' ||
        typeof parsed.currency !== 'string'
      ) {
        return { valid: false, error: 'INVALID_FORMAT' }
      }
      const payload: QRPayload = {
        walletNumber: parsed.walletNumber,
        name: parsed.name,
        currency: parsed.currency,
        ...(typeof parsed.amount === 'number' ? { amount: parsed.amount } : {}),
      }
      return { valid: true, payload }
    } catch {
      return { valid: false, error: 'INVALID_FORMAT' }
    }
  }

  /**
   * Parse an imari:// deep link URL into a navigation intent.
   * e.g. imari://transfer?identifier=0788000000
   */
  function parseDeepLink(url: string): DeepLinkPayload | null {
    try {
      const parsed = Linking.parse(url)
      if (!parsed.hostname) return null
      return {
        screen: parsed.hostname as DeepLinkPayload['screen'],
        params: (parsed.queryParams ?? {}) as Record<string, string>,
      }
    } catch {
      return null
    }
  }

  return { generateQRValue, parseQR, parseDeepLink }
}
