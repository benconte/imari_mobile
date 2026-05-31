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
import { registerPushNotifications } from '../src/hooks/useNotifications'
import { useAuth } from '../src/hooks/useAuth'
import { router } from 'expo-router'

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
  if (type === 'SECURITY_WARNING') return 'error'
  if (type === 'BUDGET_ALERT') return 'warning'
  if (type === 'SAVINGS_UPDATE' || type === 'PAYMENT_CONFIRMATION') return 'success'
  return 'info'
}

function AppContent() {
  const { isDark } = useTheme()
  const showToast = useUIStore(s => s.showToast)
  const { isAuthenticated } = useAuth()

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

  useEffect(() => {
    registerPushNotifications().catch(console.warn)

    const sub = Notifications.addNotificationReceivedListener((notification) => {
      showToast({
        message: notification.request.content.title ?? 'New notification',
        variant: getToastVariant(notification.request.content.data?.type as string | undefined),
        duration: 4000,
      })
    })
    return () => sub.remove()
  }, [showToast])

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
