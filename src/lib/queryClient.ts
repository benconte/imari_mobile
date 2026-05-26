/**
 * Imari TanStack Query client configuration.
 */

import { QueryClient } from '@tanstack/react-query'
import { QUERY_STALE_TIME_MS } from './constants'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME_MS,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
