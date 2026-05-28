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
  recipientFingerprint?: string // from lookup, optional extra validation
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

// ─── Resolved recipient from GET /wallet/transfer/lookup?walletNumber=... ────

export interface ResolvedRecipient {
  walletId: string
  walletNumber: string
  currency: string
  displayName: string | null    // real user display name
  maskedEmail: string | null    // e.g. "j***e@gmail.com"
  maskedPhone: string | null    // e.g. "07*****00"
  fingerprint: string           // sha256 of walletId:userId:walletNumber
  // convenience alias for backward compat with UI
  name: string                  // same as displayName ?? walletNumber
}

// ─── Beneficiary from GET /beneficiaries/recent ───────────────────────────────

export interface Beneficiary {
  id: string
  displayName: string
  imariWalletNumber: string    // format: IMR-XXXXXXXXXX
  phone: string | null
  lastUsedAt: string
  isFavorite: boolean
}

// ─── Recent contact derived from beneficiaries or transaction history ─────────

export interface RecentContact {
  walletNumber: string  // receiverWalletNumber from P2P_TRANSFER DEBIT txns
  initials: string      // first 2 chars of name / wallet number as avatar fallback
  displayName?: string  // from beneficiary
}
