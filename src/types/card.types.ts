export type VirtualCardStatus = 'ACTIVE' | 'FROZEN' | 'EXPIRED' | 'CANCELLED'
export type VirtualCardType = 'STANDARD' | 'VIRTUAL_ONLY'

export interface VirtualCard {
  id: string
  walletId: string
  maskedNumber: string             // "**** **** **** 4242"
  expiryMonth: number
  expiryYear: number
  cardHolder: string
  type: VirtualCardType
  status: VirtualCardStatus
  spendingLimit: number | null
  spentToday: number
  currency: string
  allowOnline: boolean
  merchantLocks: string[]          // MCC codes
  createdAt: string
  updatedAt: string
}

export interface RevealedCard extends VirtualCard {
  pan: string                      // full 16-digit PAN
  cvv: string                      // 3-digit CVV
}

export interface CreateCardPayload {
  walletId: string
  spendingLimit?: number
  allowOnline?: boolean
  merchantLocks?: string[]
}

export interface UpdateCardPayload {
  spendingLimit?: number
  allowOnline?: boolean
  merchantLocks?: string[]
}
