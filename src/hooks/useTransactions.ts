/**
 * useTransactions — TanStack Query infinite scroll + single transaction query.
 *
 * Mock mode:
 *   - Transactions API is not yet implemented on the backend.
 *   - USE_MOCK defaults to true. Set EXPO_PUBLIC_USE_MOCK=false ONLY when
 *     GET /wallet/transactions is live on the backend.
 */

import { useState, useCallback } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { groupDateLabel } from '../lib/utils/date'
import { mockTransactions, mockTransactionDetail } from '../lib/mocks/wallet.mock'
import type {
  Transaction,
  TransactionWithDetail,
  TransactionPage,
  TransactionFilters,
  TransactionSection,
} from '../types/transaction.types'

// Default true — transactions API is not yet available.
// Flip to false (via EXPO_PUBLIC_USE_MOCK=false) once the backend endpoint is live.
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK !== 'false'
const PAGE_LIMIT = 20

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildQueryParams(filters: TransactionFilters, page: number): Record<string, string> {
  const params: Record<string, string> = {
    page: String(page),
    limit: String(PAGE_LIMIT),
  }
  if (filters.direction) params.direction = filters.direction
  if (filters.type) params.type = filters.type
  if (filters.category) params.category = filters.category
  if (filters.status) params.status = filters.status
  if (filters.dateFrom) params.dateFrom = filters.dateFrom
  if (filters.dateTo) params.dateTo = filters.dateTo
  return params
}

/** Group a flat array of transactions into date-labelled sections for SectionList. */
function groupTransactions(transactions: Transaction[]): TransactionSection[] {
  const map = new Map<string, TransactionSection>()

  for (const txn of transactions) {
    const dateKey = txn.createdAt.split('T')[0] // YYYY-MM-DD
    const title = groupDateLabel(txn.createdAt)

    if (!map.has(dateKey)) {
      map.set(dateKey, { title, dateKey, netAmount: 0, data: [] })
    }

    const section = map.get(dateKey)!
    section.data.push(txn)
    section.netAmount +=
      txn.direction === 'CREDIT' ? txn.amount : -txn.amount
  }

  // Sort sections newest first
  return Array.from(map.values()).sort(
    (a, b) => b.dateKey.localeCompare(a.dateKey),
  )
}

/** Count how many filter keys are actively set. */
function countActiveFilters(filters: TransactionFilters): number {
  return Object.values(filters).filter(Boolean).length
}

// ─── API functions ────────────────────────────────────────────────────────────

async function fetchTransactionsPage(
  filters: TransactionFilters,
  page: number,
): Promise<TransactionPage> {
  const params = buildQueryParams(filters, page)
  const qs = new URLSearchParams(params).toString()
  const { data: responseBody } = await api.get<{ data: Transaction[] }>(`/wallet/transactions?${qs}`)
  const items = responseBody.data || []
  return {
    data: items,
    total: items.length,
    page,
    limit: PAGE_LIMIT,
    hasNext: items.length === PAGE_LIMIT,
  }
}

async function fetchTransactionById(id: string): Promise<TransactionWithDetail> {
  const { data: responseBody } = await api.get<{ data: TransactionWithDetail }>(`/wallet/transactions/${id}`)
  return responseBody.data
}

// ─── Mock functions ───────────────────────────────────────────────────────────

function applyMockFilters(
  transactions: Transaction[],
  filters: TransactionFilters,
): Transaction[] {
  return transactions.filter((txn) => {
    if (filters.direction && txn.direction !== filters.direction) return false
    if (filters.type && txn.type !== filters.type) return false
    if (filters.category && txn.category !== filters.category) return false
    if (filters.status && txn.status !== filters.status) return false
    if (filters.dateFrom && txn.createdAt < filters.dateFrom) return false
    if (filters.dateTo && txn.createdAt > filters.dateTo + 'T23:59:59') return false
    return true
  })
}

async function fetchMockPage(
  filters: TransactionFilters,
  page: number,
): Promise<TransactionPage> {
  await new Promise((r) => setTimeout(r, 400)) // simulate latency
  const filtered = applyMockFilters(mockTransactions, filters)
  const start = (page - 1) * PAGE_LIMIT
  const slice = filtered.slice(start, start + PAGE_LIMIT)
  return {
    data: slice,
    total: filtered.length,
    page,
    limit: PAGE_LIMIT,
    hasNext: start + PAGE_LIMIT < filtered.length,
  }
}

async function fetchMockById(id: string): Promise<TransactionWithDetail> {
  await new Promise((r) => setTimeout(r, 300))
  if (id === mockTransactionDetail.id) return mockTransactionDetail
  const found = mockTransactions.find((t) => t.id === id)
  if (!found) throw new Error('Transaction not found')
  return { ...found, senderId: null, receiverId: null, senderWalletId: null, receiverWalletId: null, exchangeRate: null, receiptUrl: null, failureReason: null, metadata: null, senderName: null, receiverName: null }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export interface UseTransactionsReturn {
  sections: TransactionSection[]
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isLoading: boolean
  isError: boolean
  refetch: () => void
  filters: TransactionFilters
  setFilters: (filters: TransactionFilters) => void
  clearFilters: () => void
  activeFilterCount: number
}

export function useTransactions(initialFilters: TransactionFilters = {}): UseTransactionsReturn {
  const queryClient = useQueryClient()
  const [filters, setFiltersState] = useState<TransactionFilters>(initialFilters)

  const queryFn = USE_MOCK ? fetchMockPage : fetchTransactionsPage

  const query = useInfiniteQuery<TransactionPage, Error>({
    queryKey: ['transactions', filters],
    queryFn: ({ pageParam }) => queryFn(filters, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
  })

  // Flatten all pages into a single array, then group by date
  const allTransactions = query.data?.pages.flatMap((p) => p.data) ?? []
  const sections = groupTransactions(allTransactions)

  const setFilters = useCallback(
    (newFilters: TransactionFilters) => {
      setFiltersState(newFilters)
      // Remove old cached pages so the new query key triggers a fresh fetch
      queryClient.removeQueries({ queryKey: ['transactions'] })
    },
    [queryClient],
  )

  const clearFilters = useCallback(() => {
    setFiltersState({})
    queryClient.removeQueries({ queryKey: ['transactions'] })
  }, [queryClient])

  return {
    sections,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    filters,
    setFilters,
    clearFilters,
    activeFilterCount: countActiveFilters(filters),
  }
}

export interface UseTransactionReturn {
  transaction: TransactionWithDetail | undefined
  isLoading: boolean
  isError: boolean
}

export function useTransaction(id: string): UseTransactionReturn {
  const queryFn = USE_MOCK ? fetchMockById : fetchTransactionById

  const query = useQuery<TransactionWithDetail, Error>({
    queryKey: ['transaction', id],
    queryFn: () => queryFn(id),
    enabled: !!id,
    retry: 1,
  })

  return {
    transaction: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
