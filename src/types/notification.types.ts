// Matches backend NotificationType enum (prisma/schema.prisma)
export type NotificationType =
  | 'TRANSACTION_ALERT'
  | 'SECURITY_WARNING'
  | 'SAVINGS_UPDATE'
  | 'BUDGET_ALERT'
  | 'PAYMENT_CONFIRMATION'
  | 'PROMOTIONAL'
  | 'FINANCIAL_INSIGHT'
  | 'SUBSCRIPTION_REMINDER'
  | 'KYC_UPDATE'
  | 'CARD_ALERT'

// Matches backend NotificationChannel enum (no SMS — backend only has IN_APP, PUSH, EMAIL)
export type NotificationChannel = 'PUSH' | 'EMAIL' | 'IN_APP'

export interface Notification {
  id: string
  type: NotificationType
  channel: NotificationChannel
  title: string
  body: string
  data: Record<string, unknown> | null
  actionUrl: string | null
  isRead: boolean
  sentAt: string | null
  readAt: string | null
  createdAt: string
}

// Backend preference model uses mutedTypes (inverted from the old `types` field).
// A notification type is ENABLED when it is NOT in mutedTypes.
export interface NotificationPreference {
  id: string
  userId: string
  channels: NotificationChannel[]
  mutedTypes: NotificationType[]
  quietFrom: string | null   // "22:00"
  quietTo: string | null     // "07:00"
  timezone: string           // e.g. "Africa/Kigali"
  emailDigest: boolean
}

export interface NotificationSection {
  title: string              // "Today", "Yesterday", "Jun 1, 2026"
  data: Notification[]
}

// ── Backend response shapes ────────────────────────────────────────────────────

export interface NotificationListResponse {
  notifications: Notification[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface UnreadCountResponse {
  count: number
}
