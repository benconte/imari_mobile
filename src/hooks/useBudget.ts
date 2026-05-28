import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mockBudget, mockForecast, mockPastBudgets } from '../mocks/budget.mock'
import { Budget, BudgetForecast, CreateBudgetPayload } from '../types/budget.types'

const USE_MOCK = true // Budgets API not yet implemented

async function fetchActiveBudget(): Promise<Budget | null> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    return mockBudget
  }
  throw new Error('Not implemented')
}

async function fetchAllBudgets(): Promise<Budget[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    return [mockBudget, ...mockPastBudgets]
  }
  throw new Error('Not implemented')
}

async function fetchBudgetById(id: string): Promise<Budget> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300))
    if (id === mockBudget.id) return mockBudget
    const past = mockPastBudgets.find((b) => b.id === id)
    if (past) return past
    throw new Error('Budget not found')
  }
  throw new Error('Not implemented')
}

async function fetchBudgetForecast(id: string): Promise<BudgetForecast> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500))
    if (id === mockBudget.id) return mockForecast
    // Dummy forecast for past
    return {
      projectedSpend: 0,
      projectedOverspend: null,
      daysRemaining: 0,
      dailyBudgetLeft: 0,
      categoryForecasts: [],
    }
  }
  throw new Error('Not implemented')
}

async function createBudgetMutation(payload: CreateBudgetPayload): Promise<Budget> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800))
    return {
      ...mockBudget,
      id: `b-${Date.now()}`,
      name: payload.name,
      totalLimit: payload.totalLimit,
      totalSpent: 0,
    }
  }
  throw new Error('Not implemented')
}

export function useBudget() {
  const queryClient = useQueryClient()

  const activeQuery = useQuery({
    queryKey: ['budgets', 'active'],
    queryFn: fetchActiveBudget,
  })

  const allQuery = useQuery({
    queryKey: ['budgets'],
    queryFn: fetchAllBudgets,
  })

  const createMut = useMutation({
    mutationFn: createBudgetMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })

  return {
    activeBudget: activeQuery.data ?? null,
    allBudgets: allQuery.data ?? [],
    isLoading: activeQuery.isLoading || allQuery.isLoading,
    refetch: () => {
      activeQuery.refetch()
      allQuery.refetch()
    },
    createBudget: createMut.mutateAsync,
    isCreating: createMut.isPending,
  }
}

export function useBudgetDetail(id: string) {
  const queryClient = useQueryClient()

  const budgetQuery = useQuery({
    queryKey: ['budgets', id],
    queryFn: () => fetchBudgetById(id),
    enabled: !!id,
  })

  const isPast = budgetQuery.data && budgetQuery.data.status !== 'ACTIVE'

  const forecastQuery = useQuery({
    queryKey: ['budgets', id, 'forecast'],
    queryFn: () => fetchBudgetForecast(id),
    enabled: !!id && !isPast,
  })

  const pauseMut = useMutation({
    mutationFn: async () => {
      await new Promise((r) => setTimeout(r, 400))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })

  const resumeMut = useMutation({
    mutationFn: async () => {
      await new Promise((r) => setTimeout(r, 400))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })

  const deleteMut = useMutation({
    mutationFn: async () => {
      await new Promise((r) => setTimeout(r, 400))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })

  return {
    budget: budgetQuery.data,
    forecast: forecastQuery.data,
    isLoading: budgetQuery.isLoading,
    isForecastLoading: forecastQuery.isLoading,
    refetch: () => {
      budgetQuery.refetch()
      forecastQuery.refetch()
    },
    pauseBudget: pauseMut.mutateAsync,
    resumeBudget: resumeMut.mutateAsync,
    deleteBudget: deleteMut.mutateAsync,
  }
}
