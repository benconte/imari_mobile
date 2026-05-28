export type NotificationType =
  | 'TRANSACTION_ALERT'
  | 'SECURITY_WARNING'
  | 'SAVINGS_UPDATE'
  | 'BUDGET_ALERT'
  | 'PAYMENT_CONFIRMATION'
  | 'PROMOTIONAL'
  | 'FINANCIAL_INSIGHT'
  | 'SUBSCRIPTION_REMINDER'

export type NotificationChannel = 'PUSH' | 'SMS' | 'EMAIL' | 'IN_APP'

export interface Notification {
  id: string
  type: NotificationType
  channel: NotificationChannel
  title: string
  body: string
  data: Record<string, any> | null
  isRead: boolean
  sentAt: string | null
  readAt: string | null
  createdAt: string
}

export interface NotificationPreference {
  channels: NotificationChannel[]
  types: NotificationType[]
  quietFrom: string | null
  quietTo: string | null
}

export interface NotificationSection {
  title: string
  data: Notification[]
}
