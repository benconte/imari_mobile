/**
 * KYC stack layout — headerShown false on all screens.
 * Swipe-back disabled to prevent accidentally leaving the KYC flow.
 */

import { Stack } from 'expo-router'

export default function KYCLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="document" />
      <Stack.Screen name="selfie" />
    </Stack>
  )
}
