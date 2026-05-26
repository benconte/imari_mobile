/**
 * useKYC — KYC status query and document submission.
 *
 * Fetches kycStatus from GET /identity/profile.
 * Submits KYC docs to POST /identity/kyc.
 *
 * NOTE: Document/selfie image URLs are currently hardcoded placeholders.
 * TODO: Once backend adds POST /identity/kyc/upload-url, replace the
 *       KYC_PLACEHOLDER_URL constant with a real upload call here.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { UserProfile, KYCSubmitPayload } from '../types/profile.types'

// TODO: Replace with real S3 URL once backend implements file upload endpoint
export const KYC_PLACEHOLDER_URL =
  'https://placeholder.imari.app/kyc/document.jpg'

const PROFILE_QUERY_KEY = ['identity', 'profile']

export function useKYC() {
  const queryClient = useQueryClient()

  const profileQuery = useQuery<UserProfile>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get<{ data: UserProfile }>('/identity/profile')
      return data.data
    },
    staleTime: 30_000,
  })

  const submitMutation = useMutation<void, Error, KYCSubmitPayload>({
    mutationFn: async (payload) => {
      await api.post('/identity/kyc', payload)
    },
    onSuccess: () => {
      // Invalidate profile so kycStatus refreshes to IN_PROGRESS
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
    },
  })

  return {
    kycStatus: profileQuery.data?.kycStatus,
    isLoading: profileQuery.isLoading,
    refetch: profileQuery.refetch,

    submitKyc: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
  }
}
