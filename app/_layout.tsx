import 'react-native-gesture-handler'
import React, { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Providers } from '../src/providers'
import { useAppReady } from '../src/hooks/useAppReady'
import { useTheme } from '../src/hooks/useTheme'
import * as Notifications from 'expo-notifications'
import * as Linking from 'expo-linking'
import { useUIStore } from '../src/stores/ui.store'
import { Toast } from '../src/components/ui/Toast'
import { registerPushNotifications, useSocketNotifications } from '../src/hooks/useNotifications'
import { useAuth } from '../src/hooks/useAuth'
import { router } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import type { Notification } from '../src/types/notification.types'

// Handle foreground push display ourselves (suppress system alert)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
})

function getToastVariant(type: string | undefined) {
  if (type === 'SECURITY_WARNING') return 'error' as const
  if (type === 'BUDGET_ALERT') return 'warning' as const
  if (type === 'SAVINGS_UPDATE' || type === 'PAYMENT_CONFIRMATION') return 'success' as const
  return 'info' as const
}

function AppContent() {
  const { isDark } = useTheme()
  const showToast = useUIStore(s => s.showToast)
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  // ── Deep link handler ────────────────────────────────────────────────────
  const handleDeepLink = (url: string) => {
    if (!isAuthenticated) return
    try {
      const parsed = Linking.parse(url)
      const screen = parsed.hostname
      const params = (parsed.queryParams ?? {}) as Record<string, string>
      switch (screen) {
        case 'transfer':
          router.push({ pathname: '/(app)/transfer/send', params } as never)
          break
        case 'receive':
          router.push('/(app)/qr/show' as never)
          break
        case 'transaction':
          if (params.id) router.push(`/(app)/transaction/${params.id}` as never)
          break
        case 'vault':
          if (params.id) router.push(`/(app)/savings/${params.id}` as never)
          break
      }
    } catch {
      // Ignore malformed deep links
    }
  }

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url)
    })
    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url))
    return () => sub.remove()
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Push notification registration + foreground handler ──────────────────
  useEffect(() => {
    registerPushNotifications().catch(console.warn)

    // Handle foreground push notifications (from FCM/APNs, not WebSocket)
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const type = notification.request.content.data?.type as string | undefined
      showToast({
        message: notification.request.content.title ?? 'New notification',
        variant: getToastVariant(type),
        duration: 4000,
      })
      // Refresh notification list
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    })
    return () => sub.remove()
  }, [showToast, queryClient])

  // ── Real-time WebSocket notifications ────────────────────────────────────
  useSocketNotifications(
    (notification: Notification) => {
      // Show in-app Toast banner for real-time in-app notifications
      showToast({
        message: notification.title,
        variant: getToastVariant(notification.type),
        duration: 4000,
      })
      // Invalidate the notifications list so it refreshes
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    isAuthenticated,
  )

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="lock" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(app)" />
      </Stack>
      <Toast />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  )
}

export default function RootLayout() {
  const isReady = useAppReady()

  if (!isReady) return null

  return (
    <Providers>
      <AppContent />
    </Providers>
  )
}
