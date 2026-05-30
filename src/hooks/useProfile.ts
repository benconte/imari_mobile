/**
 * useProfile — full user profile, update, and device management.
 *
 * Endpoints:
 *   GET  /identity/profile        → UserProfile
 *   PATCH /identity/profile       → updated fields
 *   GET  /identity/devices        → UserDevice[]
 *   DELETE /identity/devices/:id  → void
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useContext } from 'react'
import { api } from '../lib/api'
import { storage } from '../lib/storage'
import { STORAGE_KEYS } from '../lib/constants'
import { AuthContext } from '../providers/AuthProvider'
import type { UserProfile, UserDevice, UpdateProfilePayload } from '../types/profile.types'

const PROFILE_KEY = ['identity', 'profile']
const DEVICES_KEY = ['identity', 'devices']

export function useProfile() {
  const queryClient = useQueryClient()
  const authCtx = useContext(AuthContext)

  // ── Profile query ───────────────────────────────────────────────────────────
  const profileQuery = useQuery<UserProfile>({
    queryKey: PROFILE_KEY,
    queryFn: async () => {
      const { data } = await api.get<{ data: UserProfile }>('/identity/profile')
      const profile = data.data
      // Sync isPinSet into AuthContext whenever profile is (re)fetched
      if (authCtx?.setIsPinSet && typeof (profile as any).isPinSet === 'boolean') {
        authCtx.setIsPinSet((profile as any).isPinSet)
      }
      return profile
    },
    staleTime: 60_000,
  })

  // ── Update profile ──────────────────────────────────────────────────────────
  const updateMutation = useMutation<UserProfile, Error, UpdateProfilePayload>({
    mutationFn: async (payload) => {
      const { data } = await api.patch<{ data: UserProfile }>(
        '/identity/profile',
        payload,
      )
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY })
    },
  })

  // ── Devices query ───────────────────────────────────────────────────────────
  const devicesQuery = useQuery<UserDevice[]>({
    queryKey: DEVICES_KEY,
    queryFn: async () => {
      const { data } = await api.get<{ data: UserDevice[] }>('/identity/devices')
      const currentDeviceId = await storage.get(STORAGE_KEYS.DEVICE_ID)
      return data.data.map((d) => ({
        ...d,
        isCurrent: d.deviceId === currentDeviceId,
      }))
    },
    staleTime: 60_000,
  })

  // ── Revoke device ───────────────────────────────────────────────────────────
  const revokeMutation = useMutation<void, Error, string>({
    mutationFn: async (deviceId: string) => {
      await api.delete(`/identity/devices/${deviceId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEVICES_KEY })
    },
  })

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    refetch: profileQuery.refetch,

    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    devices: devicesQuery.data ?? [],
    isLoadingDevices: devicesQuery.isLoading,

    revokeDevice: revokeMutation.mutateAsync,
    isRevoking: revokeMutation.isPending,
  }
}
