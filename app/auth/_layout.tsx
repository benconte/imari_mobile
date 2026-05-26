/**
 * Auth stack layout — no header, dark canvas background.
 */

import { Stack } from 'expo-router'
import { useTheme } from '../../src/hooks/useTheme'

export default function AuthLayout() {
  const { COLORS } = useTheme()

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background.primary },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-otp" />
    </Stack>
  )
}
