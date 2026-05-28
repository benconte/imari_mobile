import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mockCards, mockRevealedCard } from '../mocks/cards.mock'
import { VirtualCard, RevealedCard, CreateCardPayload, UpdateCardPayload } from '../types/card.types'

const USE_MOCK = true

async function fetchCards(): Promise<VirtualCard[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    return mockCards
  }
  throw new Error('Not implemented')
}

async function createCard(payload: CreateCardPayload): Promise<VirtualCard> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800))
    return {
      id: `vc-${Date.now()}`,
      walletId: payload.walletId,
      maskedNumber: '**** **** **** 1234',
      expiryMonth: new Date().getMonth() + 4, // roughly 3 months
      expiryYear: parseInt(new Date().getFullYear().toString().slice(-2)),
      cardHolder: 'JOHN DOE',
      type: 'VIRTUAL_ONLY',
      status: 'ACTIVE',
      spendingLimit: payload.spendingLimit || null,
      spentToday: 0,
      currency: 'RWF',
      allowOnline: payload.allowOnline ?? true,
      merchantLocks: payload.merchantLocks || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }
  throw new Error('Not implemented')
}

export function useVirtualCards() {
  const queryClient = useQueryClient()

  const { data: cards = [], isLoading, refetch } = useQuery({
    queryKey: ['cards'],
    queryFn: fetchCards,
  })

  const createMut = useMutation({
    mutationFn: createCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] })
    },
  })

  return {
    cards,
    isLoading,
    refetch,
    createCard: createMut.mutateAsync,
    isCreating: createMut.isPending,
  }
}

export function useCard(id: string) {
  const queryClient = useQueryClient()
  const [revealedCard, setRevealedCard] = useState<RevealedCard | null>(null)
  const [isRevealing, setIsRevealing] = useState(false)

  const { data: card, isLoading } = useQuery({
    queryKey: ['cards', id],
    queryFn: async () => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 300))
        const found = mockCards.find(c => c.id === id)
        if (found) return found
        // if freshly created mock card
        return {
          id,
          walletId: 'w-1',
          maskedNumber: '**** **** **** 1234',
          expiryMonth: 12,
          expiryYear: 28,
          cardHolder: 'JOHN DOE',
          type: 'VIRTUAL_ONLY',
          status: 'ACTIVE',
          spendingLimit: null,
          spentToday: 0,
          currency: 'RWF',
          allowOnline: true,
          merchantLocks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as VirtualCard
      }
      throw new Error('Not implemented')
    },
    enabled: !!id,
  })

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    if (revealedCard) {
      timeout = setTimeout(() => {
        setRevealedCard(null)
      }, 30000)
    }
    return () => clearTimeout(timeout)
  }, [revealedCard])

  const reveal = useCallback(async (pin: string) => {
    setIsRevealing(true)
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 600))
      if (pin === '0000' || pin === '1234') { // any dummy validation
        setRevealedCard({ ...card, ...mockRevealedCard } as RevealedCard)
      } else {
        setIsRevealing(false)
        throw new Error('Incorrect PIN')
      }
    }
    setIsRevealing(false)
  }, [card])

  const hideDetails = useCallback(() => setRevealedCard(null), [])

  const freeze = useMutation({
    mutationFn: async () => { await new Promise(r => setTimeout(r, 400)) },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cards'] })
  }).mutateAsync

  const unfreeze = useMutation({
    mutationFn: async () => { await new Promise(r => setTimeout(r, 400)) },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cards'] })
  }).mutateAsync

  const updateLimits = useMutation({
    mutationFn: async (payload: UpdateCardPayload) => { await new Promise(r => setTimeout(r, 400)) },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cards'] })
  }).mutateAsync

  const deleteCard = useMutation({
    mutationFn: async () => { await new Promise(r => setTimeout(r, 400)) },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cards'] })
  }).mutateAsync

  return {
    card,
    revealedCard,
    isLoading,
    isRevealing,
    reveal,
    hideDetails,
    freeze,
    unfreeze,
    updateLimits,
    deleteCard,
  }
}
