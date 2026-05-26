/**
 * Transfer types — aligned with backend POST /wallet/transfer contract.
 * PIN is 4 digits. Recipient is wallet number format: IMR-XXXXXXXXXX.
 */

// ─── Payload sent to POST /wallet/transfer ────────────────────────────────────

export interface TransferPayload {
  receiverWalletNumber: string  // format: IMR-XXXXXXXXXX
  amount: string                // string e.g. "5000" (backend expects string)
  currency: string              // "RWF", "USD", etc.
  description?: string
  pin: string                   // 4-digit PIN
  idempotencyKey?: string       // UUID, optional
}

// ─── Response from POST /wallet/transfer ──────────────────────────────────────

export interface TransferResult {
  transactionId: string
  reference: string
  amount: string
  currency: string
  senderWalletNumber: string
  receiverWalletNumber: string
  status: string
  processedAt: string | null
}

// ─── Mock-only: resolved recipient name (no backend endpoint yet) ─────────────

export interface ResolvedRecipient {
  walletNumber: string
  name: string           // display name — mock for now
  currency: string
}

// ─── Recent contact derived from transaction history ──────────────────────────

export interface RecentContact {
  walletNumber: string  // receiverWalletNumber from P2P_TRANSFER DEBIT txns
  initials: string      // first 2 chars of wallet number as avatar fallback
}
