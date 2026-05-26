/**
 * Imari Login Screen.
 * Premium dark auth canvas. Email + password. Biometric shortcut.
 * Inline field validation. Calls POST /auth/login with device info.
 *
 * After login, fetches /identity/profile to check kycStatus and routes:
 *   VERIFIED    → /(app)/(tabs)/home
 *   IN_PROGRESS → /(app)/kyc-pending
 *   else        → /(app)/kyc (NOT_STARTED or REJECTED → resubmit)
 */

import React, { useState } from 'react'
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import * as LocalAuthentication from 'expo-local-authentication'
import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { useTheme } from '../../src/hooks/useTheme'
import { useAuth } from '../../src/hooks/useAuth'
import { api } from '../../src/lib/api'
import { collectDeviceInfo } from '../../src/lib/device'
import { Text } from '../../src/components/ui/Text'
import { Input } from '../../src/components/ui/Input'
import { Button } from '../../src/components/ui/Button'
import { KeyboardView } from '../../src/components/layout/KeyboardView'
import type { User } from '../../src/types/auth.types'
import type { UserProfile } from '../../src/types/profile.types'

interface LoginErrors {
  email?: string
  password?: string
}

function validate(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {}
  if (!email.trim()) errors.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Enter a valid email'
  if (!password) errors.password = 'Password is required'
  else if (password.length < 6) errors.password = 'Password too short'
  return errors
}

/** Route based on kycStatus fetched from /identity/profile */
async function routeAfterLogin(): Promise<void> {
  try {
    const { data } = await api.get<{ data: UserProfile }>('/identity/profile')
    const status = data.data.kycStatus

    if (status === 'VERIFIED') {
      router.replace('/(app)/(tabs)/home' as never)
    } else if (status === 'IN_PROGRESS') {
      router.replace('/(app)/kyc-pending' as never)
    } else {
      // NOT_STARTED or REJECTED — send to KYC flow
      router.replace('/(app)/kyc' as never)
    }
  } catch {
    // Fallback: if profile fetch fails, go to KYC (safe default)
    router.replace('/(app)/kyc' as never)
  }
}

export default function LoginScreen() {
  const { COLORS, spacing } = useTheme()
  const { login } = useAuth()
  const params = useLocalSearchParams<{ verified?: string }>()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<LoginErrors>({})
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    const errs = validate(email, password)
    if (Object.keys(errs).length) {
      setErrors(errs)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      const device = await collectDeviceInfo()

      const { data } = await api.post<{
        data: { accessToken: string; refreshToken: string; user: User }
      }>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
        device,
      })

      await login(data.data.accessToken, data.data.refreshToken, data.data.user)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      // Route based on kycStatus
      await routeAfterLogin()
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      const axiosMsg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message
      Alert.alert('Login Failed', axiosMsg ?? 'Please check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBiometric = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Sign in to Imari',
      fallbackLabel: 'Use password',
    })
    if (result.success) {
      // TODO: biometric token flow — retrieve stored token from SecureStore
      Alert.alert('Biometric OK', 'Biometric login will be wired in the Polish pass.')
    }
  }

  return (
    <KeyboardView>
      <StatusBar style="light" />
      <LinearGradient
        colors={[COLORS.background.primary, COLORS.background.secondary]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.container, { paddingHorizontal: spacing[6] }]}>
        {/* Verified success banner */}
        {params.verified === '1' && (
          <View
            style={[
              styles.verifiedBanner,
              {
                backgroundColor: COLORS.status.successMuted,
                borderColor: COLORS.status.success,
                marginBottom: spacing[4],
                borderRadius: 8,
                padding: spacing[3],
                borderWidth: 1,
              },
            ]}
          >
            <Text variant="bodySmall" color={COLORS.status.success}>
              ✓ Email verified! Sign in to continue.
            </Text>
          </View>
        )}

        {/* Wordmark */}
        <View style={[styles.logoArea, { marginTop: spacing[16], marginBottom: spacing[8] }]}>
          <Text variant="display" color={COLORS.text.primary}>
            ima
            <Text variant="display" color={COLORS.accent.primary}>ri</Text>
          </Text>
          <Text variant="bodySmall" color={COLORS.text.secondary} style={{ marginTop: spacing[1] }}>
            Your intelligent finance companion
          </Text>
        </View>

        {/* Form */}
        <View style={[styles.form, { gap: spacing[4] }]}>
          <Input
            label="Email"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })) }}
            error={errors.email}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            autoComplete="email"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })) }}
            error={errors.password}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <Pressable
            onPress={() => router.push('/auth/forgot')}
            accessibilityRole="link"
            style={{ alignSelf: 'flex-end' }}
          >
            <Text variant="label" color={COLORS.accent.primary}>
              Forgot password?
            </Text>
          </Pressable>
        </View>

        {/* Actions */}
        <View style={[styles.actions, { gap: spacing[3], marginTop: spacing[6] }]}>
          <Button
            fullWidth
            size="lg"
            loading={loading}
            onPress={handleLogin}
            accessibilityLabel="Sign in"
          >
            Sign in
          </Button>

          <Button
            fullWidth
            size="md"
            variant="ghost"
            onPress={handleBiometric}
            accessibilityLabel="Sign in with biometrics"
          >
            Sign in with biometrics
          </Button>
        </View>

        {/* Register link */}
        <View style={[styles.footer, { marginTop: spacing[8] }]}>
          <Text variant="body" color={COLORS.text.secondary}>
            Don't have an account?{' '}
          </Text>
          <Pressable onPress={() => router.push({ pathname: '/auth/register' })} accessibilityRole="link">
            <Text variant="body" color={COLORS.accent.primary} style={{ fontFamily: 'DMSans_700Bold' }}>
              Register
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  logoArea: {},
  form: {},
  actions: {},
  footer: { flexDirection: 'row', justifyContent: 'center' },
  verifiedBanner: {},
})
