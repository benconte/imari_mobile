import { VirtualCard, RevealedCard } from '../types/card.types'

export const mockCards: VirtualCard[] = [
  {
    id: 'vc-1',
    walletId: 'w-1',
    maskedNumber: '**** **** **** 4242',
    expiryMonth: 12,
    expiryYear: 28,
    cardHolder: 'JOHN DOE',
    type: 'VIRTUAL_ONLY',
    status: 'ACTIVE',
    spendingLimit: 500000,
    spentToday: 150000,
    currency: 'RWF',
    allowOnline: true,
    merchantLocks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vc-2',
    walletId: 'w-1',
    maskedNumber: '**** **** **** 8888',
    expiryMonth: 5,
    expiryYear: 26,
    cardHolder: 'JOHN DOE',
    type: 'STANDARD',
    status: 'FROZEN',
    spendingLimit: null,
    spentToday: 0,
    currency: 'RWF',
    allowOnline: false,
    merchantLocks: ['GAMBLING', 'ADULT'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
]

export const mockRevealedCard: RevealedCard = {
  ...mockCards[0],
  pan: '4242424242424242',
  cvv: '123'
}
