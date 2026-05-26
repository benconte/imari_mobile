/**
 * Imari transaction types — complete for Sessions 3+.
 * Aligned with backend Prisma schema (schema.prisma).
 */

// ─── Enums (matching backend exactly) ────────────────────────────────────────

export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'P2P_TRANSFER'
  | 'MERCHANT_PAYMENT'
  | 'QR_PAYMENT'
  | 'SCHEDULED_TRANSFER'
  | 'CARD_PAYMENT'
  | 'VAULT_CONTRIBUTION'
  | 'VAULT_WITHDRAWAL'
  | 'SUBSCRIPTION_CHARGE'
  | 'REVERSAL'
  | 'REFUND'
  | 'FEE'

export type TransactionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REVERSED'
  | 'CANCELLED'
  | 'REQUIRES_ACTION'

export type TransactionDirection = 'CREDIT' | 'DEBIT'

export type SpendingCategory =
  | 'FOOD_AND_DINING'
  | 'GROCERIES'
  | 'TRANSPORT'
  | 'SHOPPING'
  | 'ENTERTAINMENT'
  | 'UTILITIES'
  | 'RENT'
  | 'HEALTH'
  | 'EDUCATION'
  | 'TRAVEL'
  | 'SUBSCRIPTIONS'
  | 'TRANSFERS'
  | 'INCOME'
  | 'FEES'
  | 'SAVINGS'
  | 'OTHER'

// ─── Base Transaction (list view) ────────────────────────────────────────────

export interface Transaction {
  id: string
  reference: string
  type: TransactionType
  direction: TransactionDirection
  amount: number
  currency: string
  fee: number
  netAmount?: number
  status: TransactionStatus
  category: SpendingCategory | null
  description: string | null
  merchantName: string | null
  merchantId: string | null
  processedAt: string | null
  createdAt: string
}

// ─── Expanded Transaction (detail screen) ────────────────────────────────────

export interface TransactionWithDetail extends Transaction {
  senderId: string | null
  receiverId: string | null
  senderWalletId: string | null
  receiverWalletId: string | null
  exchangeRate: number | null
  receiptUrl: string | null
  failureReason: string | null
  metadata: Record<string, unknown> | null
  // Joined display fields (resolved by backend)
  senderName: string | null
  receiverName: string | null
}

// ─── Paginated list response ──────────────────────────────────────────────────

export interface TransactionPage {
  data: Transaction[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}

// ─── Filter state ─────────────────────────────────────────────────────────────

export interface TransactionFilters {
  type?: TransactionType
  category?: SpendingCategory
  status?: TransactionStatus
  direction?: TransactionDirection
  dateFrom?: string   // ISO date string YYYY-MM-DD
  dateTo?: string     // ISO date string YYYY-MM-DD
}

// ─── Grouped section for SectionList ─────────────────────────────────────────

export interface TransactionSection {
  title: string     // "Today" | "Yesterday" | "Dec 12, 2024"
  dateKey: string   // YYYY-MM-DD
  netAmount: number // positive = net credit, negative = net debit
  data: Transaction[]
}

// ─── Human-readable label maps ────────────────────────────────────────────────

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  DEPOSIT: 'Deposit',
  WITHDRAWAL: 'Withdrawal',
  P2P_TRANSFER: 'Transfer',
  MERCHANT_PAYMENT: 'Merchant Payment',
  QR_PAYMENT: 'QR Payment',
  SCHEDULED_TRANSFER: 'Scheduled Transfer',
  CARD_PAYMENT: 'Card Payment',
  VAULT_CONTRIBUTION: 'Savings Deposit',
  VAULT_WITHDRAWAL: 'Savings Withdrawal',
  SUBSCRIPTION_CHARGE: 'Subscription',
  REVERSAL: 'Reversal',
  REFUND: 'Refund',
  FEE: 'Fee',
}

export const SPENDING_CATEGORY_LABELS: Record<SpendingCategory, string> = {
  FOOD_AND_DINING: 'Food & Dining',
  GROCERIES: 'Groceries',
  TRANSPORT: 'Transport',
  SHOPPING: 'Shopping',
  ENTERTAINMENT: 'Entertainment',
  UTILITIES: 'Utilities',
  RENT: 'Rent',
  HEALTH: 'Health',
  EDUCATION: 'Education',
  TRAVEL: 'Travel',
  SUBSCRIPTIONS: 'Subscriptions',
  TRANSFERS: 'Transfers',
  INCOME: 'Income',
  FEES: 'Fees',
  SAVINGS: 'Savings',
  OTHER: 'Other',
}
