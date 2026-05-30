import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { mockCards, mockRevealedCard } from '../mocks/cards.mock'
import { VirtualCard, RevealedCard, CreateCardPayload, UpdateCardPayload } from '../types/card.types'

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true'

interface ApiResponse<T> {
  data: T
}

function normalizeCard(c: any): VirtualCard {
  return {
    ...c,
    spendingLimit: c.spendingLimit ? Number(c.spendingLimit) : null,
    dailyLimit: c.dailyLimit ? Number(c.dailyLimit) : null,
    spentToday: c.spentToday ? Number(c.spentToday) : 0,
    merchantLocks: c.allowedMerchants || c.blockedMccs || [],
  }
}

async function apiFetchCards(): Promise<VirtualCard[]> {
  const res = await api.get<ApiResponse<VirtualCard[]>>('/virtual-card')
  return (res.data.data ?? []).map(normalizeCard)
}

async function apiFetchCard(id: string): Promise<VirtualCard> {
  const res = await api.get<ApiResponse<VirtualCard>>(`/virtual-card/${id}`)
  return normalizeCard(res.data.data)
}

async function apiCreateCard(payload: CreateCardPayload): Promise<VirtualCard> {
  const body = {
    walletId: payload.walletId,
    type: payload.type || 'MULTI_USE',
    currency: payload.currency || 'RWF',
    spendingLimit: payload.spendingLimit ? String(payload.spendingLimit) : undefined,
    allowOnline: payload.allowOnline ?? true,
    allowedMerchants: payload.merchantLocks || undefined, // Adjust field names
  }
  const res = await api.post<ApiResponse<VirtualCard>>('/virtual-card', body)
  return normalizeCard(res.data.data)
}

async function apiUpdateCard(id: string, payload: UpdateCardPayload): Promise<VirtualCard> {
  const body = {
    spendingLimit: payload.spendingLimit ? String(payload.spendingLimit) : undefined,
    allowOnline: payload.allowOnline,
    allowedMerchants: payload.merchantLocks || undefined,
  }
  const res = await api.patch<ApiResponse<VirtualCard>>(`/virtual-card/${id}`, body)
  return normalizeCard(res.data.data)
}

export function useVirtualCards() {
  const queryClient = useQueryClient()

  const { data: cards = [], isLoading, refetch } = useQuery({
    queryKey: ['cards'],
    queryFn: USE_MOCK ? async () => {
      await new Promise(r => setTimeout(r, 400))
      return mockCards
    } : apiFetchCards,
  })

  const createMut = useMutation({
    mutationFn: async (payload: CreateCardPayload) => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 800))
        return {
          id: `vc-${Date.now()}`,
          walletId: payload.walletId,
          maskedNumber: '**** **** **** 1234',
          expiryMonth: new Date().getMonth() + 4,
          expiryYear: parseInt(new Date().getFullYear().toString().slice(-2)),
          cardHolder: 'JOHN DOE',
          type: payload.type || 'VIRTUAL_ONLY',
          status: 'ACTIVE',
          spendingLimit: payload.spendingLimit || null,
          spentToday: 0,
          currency: payload.currency || 'RWF',
          allowOnline: payload.allowOnline ?? true,
          merchantLocks: payload.merchantLocks || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as VirtualCard
      }
      return apiCreateCard(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] })
      queryClient.invalidateQueries({ queryKey: ['wallet', 'dashboard'] })
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
      return apiFetchCard(id)
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
      if (pin === '0000' || pin === '1234') {
        setRevealedCard({ ...card, ...mockRevealedCard } as RevealedCard)
      } else {
        setIsRevealing(false)
        throw new Error('Incorrect PIN')
      }
    } else {
      // Backend does not support reveal yet
      await new Promise(r => setTimeout(r, 600))
      if (pin === '1234') {
         setRevealedCard({ ...card, pan: '4242424242424242', cvv: '123' } as RevealedCard)
      } else {
         setIsRevealing(false)
         throw new Error('Endpoint not implemented, try PIN 1234')
      }
    }
    setIsRevealing(false)
  }, [card])

  const hideDetails = useCallback(() => setRevealedCard(null), [])

  const freeze = useMutation({
    mutationFn: async () => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 400))
        return
      }
      await api.patch(`/virtual-card/${id}/freeze`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] })
      queryClient.invalidateQueries({ queryKey: ['cards', id] })
    }
  }).mutateAsync

  const unfreeze = useMutation({
    mutationFn: async () => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 400))
        return
      }
      await api.patch(`/virtual-card/${id}/unfreeze`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] })
      queryClient.invalidateQueries({ queryKey: ['cards', id] })
    }
  }).mutateAsync

  const updateLimits = useMutation({
    mutationFn: async (payload: UpdateCardPayload) => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 400))
        return
      }
      await apiUpdateCard(id, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] })
      queryClient.invalidateQueries({ queryKey: ['cards', id] })
    }
  }).mutateAsync

  const deleteCard = useMutation({
    mutationFn: async () => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 400))
        return
      }
      throw new Error('Delete card endpoint not implemented')
    },
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
