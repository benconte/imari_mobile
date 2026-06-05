/**
 * useNotifications — real backend integration.
 *
 * Endpoints:
 *   GET  /notifications?page=1&limit=50   → NotificationListResponse
 *   GET  /notifications/unread-count      → { count }
 *   PATCH /notifications/:id/read         → void
 *   PATCH /notifications/read-all         → { marked }
 *   GET  /notifications/preferences       → NotificationPreference
 *   PUT  /notifications/preferences       → NotificationPreference
 *   POST /identity/devices                → (registers device + push token)
 *
 * Real-time: Socket.IO /ws gateway emits 'notification' on new in-app delivery.
 */

import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { io, Socket } from 'socket.io-client'
import { api } from '../lib/api'
import { storage } from '../lib/storage'
import { STORAGE_KEYS, API_URL } from '../lib/constants'
import { groupDateLabel } from '../lib/utils/date'
import type {
  Notification,
  NotificationListResponse,
  NotificationPreference,
  NotificationSection,
  UnreadCountResponse,
} from '../types/notification.types'

// ── Query keys ─────────────────────────────────────────────────────────────────
const NOTIF_KEY = ['notifications'] as const
const PREFS_KEY = ['notification-preferences'] as const

// ── useNotifications ───────────────────────────────────────────────────────────
export function useNotifications() {
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery<NotificationListResponse>({
    queryKey: NOTIF_KEY,
    queryFn: async () => {
      const res = await api.get<{ data: NotificationListResponse }>(
        '/notifications',
        { params: { page: 1, limit: 50 } },
      )
      return res.data.data
    },
    staleTime: 30_000,
  })

  const notifications: Notification[] = data?.notifications ?? []
  const unreadCount = notifications.filter(n => !n.isRead).length

  // Group by date into sections
  const sectionsMap = new Map<string, Notification[]>()
  notifications.forEach(n => {
    const label = groupDateLabel(n.createdAt)
    if (!sectionsMap.has(label)) sectionsMap.set(label, [])
    sectionsMap.get(label)!.push(n)
  })
  const sections: NotificationSection[] = Array.from(sectionsMap.entries()).map(
    ([title, data]) => ({ title, data }),
  )

  // ── Mark single read ──────────────────────────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`)
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: NOTIF_KEY })
      const prev = queryClient.getQueryData<NotificationListResponse>(NOTIF_KEY)
      queryClient.setQueryData<NotificationListResponse>(NOTIF_KEY, old => {
        if (!old) return old
        return {
          ...old,
          notifications: old.notifications.map(n =>
            n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n,
          ),
        }
      })
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(NOTIF_KEY, ctx.prev)
    },
  })

  // ── Mark all read ─────────────────────────────────────────────────────────
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all')
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIF_KEY })
      const prev = queryClient.getQueryData<NotificationListResponse>(NOTIF_KEY)
      queryClient.setQueryData<NotificationListResponse>(NOTIF_KEY, old => {
        if (!old) return old
        const now = new Date().toISOString()
        return {
          ...old,
          notifications: old.notifications.map(n => ({ ...n, isRead: true, readAt: n.readAt ?? now })),
        }
      })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(NOTIF_KEY, ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIF_KEY }),
  })

  // ── Dismiss (UI-only — no backend DELETE endpoint) ────────────────────────
  const dismissMutation = useMutation({
    mutationFn: async (_id: string) => {
      // Backend has no DELETE /notifications/:id — optimistic UI removal only
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: NOTIF_KEY })
      const prev = queryClient.getQueryData<NotificationListResponse>(NOTIF_KEY)
      queryClient.setQueryData<NotificationListResponse>(NOTIF_KEY, old => {
        if (!old) return old
        return { ...old, notifications: old.notifications.filter(n => n.id !== id) }
      })
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(NOTIF_KEY, ctx.prev)
    },
  })

  return {
    sections,
    unreadCount,
    isLoading,
    refetch,
    markRead: (id: string) => markReadMutation.mutateAsync(id),
    markAllRead: () => markAllReadMutation.mutateAsync(),
    dismiss: (id: string) => dismissMutation.mutateAsync(id),
  }
}

// ── useNotificationPreferences ─────────────────────────────────────────────────
export function useNotificationPreferences() {
  const queryClient = useQueryClient()

  const { data: preferences, isLoading } = useQuery<NotificationPreference>({
    queryKey: PREFS_KEY,
    queryFn: async () => {
      const res = await api.get<{ data: NotificationPreference }>('/notifications/preferences')
      return res.data.data
    },
    staleTime: 5 * 60_000,
  })

  const updateMutation = useMutation({
    mutationFn: async (prefs: Partial<NotificationPreference>) => {
      // Backend uses PUT (not PATCH) for preferences
      const res = await api.put<{ data: NotificationPreference }>(
        '/notifications/preferences',
        prefs,
      )
      return res.data.data
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(PREFS_KEY, updated)
    },
  })

  return {
    preferences,
    isLoading,
    update: (prefs: Partial<NotificationPreference>) => updateMutation.mutateAsync(prefs),
    isUpdating: updateMutation.isPending,
  }
}

// ── useSocketNotifications ─────────────────────────────────────────────────────
/**
 * Connects to the backend WebSocket gateway at /ws.
 * Auth: JWT access token sent in socket handshake auth.token.
 * Listens for 'notification' events and calls onNotification callback.
 * Safe to call from _layout.tsx — manages its own connect/disconnect lifecycle.
 */
export function useSocketNotifications(
  onNotification: (notification: Notification) => void,
  isAuthenticated: boolean,
) {
  const socketRef = useRef<Socket | null>(null)
  const onNotificationRef = useRef(onNotification)
  onNotificationRef.current = onNotification

  useEffect(() => {
    if (!isAuthenticated) return

    let active = true

    const connect = async () => {
      const token = await storage.get(STORAGE_KEYS.ACCESS_TOKEN)
      if (!token || !active) return

      // Derive WS base URL from API_URL (strip /api/v1 suffix for the socket root)
      const wsBase = API_URL.replace(/\/api\/v[0-9]+$/, '')

      const socket = io(`${wsBase}/ws`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      })

      socketRef.current = socket

      socket.on('notification', (data: Notification) => {
        onNotificationRef.current(data)
      })

      socket.on('connect_error', (err) => {
        console.warn('[WS] connect_error:', err.message)
      })
    }

    connect()

    return () => {
      active = false
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [isAuthenticated])
}

// ── registerPushNotifications ──────────────────────────────────────────────────
/**
 * Requests Expo push notification permission and registers the device +
 * Expo push token with the backend via POST /identity/devices.
 *
 * The backend uses expo-server-sdk to validate and send push notifications
 * via the Expo Push Notification Service. The token format is:
 * ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
 *
 * Requires EXPO_ACCESS_TOKEN to be set in the backend .env.
 */
export async function registerPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') return null

  try {
    const projectId = '6ce69652-a9e4-4a5d-96db-4125f7a1cbfc'
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })
    const pushToken = tokenData.data

    // Register device with push token via POST /identity/devices
    const deviceId = await storage.get(STORAGE_KEYS.DEVICE_ID)
    if (deviceId) {
      await api.post('/identity/devices', {
        deviceId,
        deviceName: Device.deviceName ?? 'Unknown Device',
        deviceType: Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB',
        platform: Platform.OS,
        osVersion: Device.osVersion ?? undefined,
        pushToken,
      })
    }

    return pushToken
  } catch (error) {
    console.warn('[Push] Failed to register push token:', error)
    return null
  }
}
