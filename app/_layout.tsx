import 'react-native-gesture-handler'
import React from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Providers } from '../src/providers'
import { useAppReady } from '../src/hooks/useAppReady'
import { useTheme } from '../src/hooks/useTheme'

function AppContent() {
  const { isDark } = useTheme()

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(app)" />
      </Stack>
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
