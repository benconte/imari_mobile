/**
 * useDevices — fetch and manage user devices.
 *
 * Endpoints:
 *   GET  /identity/devices        → { devices: UserDevice[] }
 *   DELETE /identity/devices/:id  → void
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { storage } from '../lib/storage'
import { STORAGE_KEYS } from '../lib/constants'
import type { UserDevice } from '../types/profile.types'

const DEVICES_KEY = ['identity', 'devices']

export function useDevices() {
  const queryClient = useQueryClient()

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
    devices: devicesQuery.data ?? [],
    isLoadingDevices: devicesQuery.isLoading,
    refetchDevices: devicesQuery.refetch,
    revokeDevice: revokeMutation.mutateAsync,
    isRevoking: revokeMutation.isPending,
  }
}
