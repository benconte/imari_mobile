import 'react-native-gesture-handler'
import React, { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Providers } from '../src/providers'
import { useAppReady } from '../src/hooks/useAppReady'
import { useTheme } from '../src/hooks/useTheme'
import * as Notifications from 'expo-notifications'
import { useUIStore } from '../src/stores/ui.store'
import { Toast } from '../src/components/ui/Toast'
import { registerPushNotifications } from '../src/hooks/useNotifications'

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

  useEffect(() => {
    // Attempt registration silently
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
