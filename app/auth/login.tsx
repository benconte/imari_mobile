/**
 * Imari Login Screen.
 * Premium dark auth canvas. Email + password + optional MFA TOTP.
 * Inline field validation. Calls POST /auth/login with device info.
 *
 * After login, fetches /identity/profile to check kycStatus and routes:
 *   VERIFIED    → /(app)/(tabs)/home
 *   IN_PROGRESS → /(app)/kyc-pending
 *   else        → /(app)/kyc (NOT_STARTED or REJECTED → resubmit)
 *
 * MFA: if the backend responds with a 401 containing "MFA required" (or similar),
 * we show the TOTP input inline and re-submit. If the user has MFA enabled and
 * doesn't provide a code, the backend will signal that. We prompt for the TOTP code
 * on the second pass.
 */

import React, { useState } from 'react'
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
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
import { AxiosError } from 'axios'

interface LoginErrors {
  email?: string
  password?: string
  totp?: string
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
    router.replace('/(app)/kyc' as never)
  }
}

export default function LoginScreen() {
  const { COLORS, spacing } = useTheme()
  const { login } = useAuth()
  const params = useLocalSearchParams<{ verified?: string }>()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [mfaRequired, setMfaRequired] = useState(false)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    const errs = validate(email, password)
    if (Object.keys(errs).length) {
      setErrors(errs)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }
    if (mfaRequired && totpCode.length !== 6) {
      setErrors((e) => ({ ...e, totp: 'Enter your 6-digit authenticator code' }))
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
        ...(mfaRequired && totpCode ? { totpCode } : {}),
      })

      await login(data.data.accessToken, data.data.refreshToken, data.data.user)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      await routeAfterLogin()
    } catch (err: unknown) {
      console.log(err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      const axiosErr = err instanceof AxiosError ? err : null
      const axiosMsg = axiosErr?.response?.data?.message as string | undefined
      console.log(axiosMsg);


      if (typeof axiosMsg === 'string' && axiosMsg.includes('verify your email address')) {
        router.push({
          pathname: '/auth/verify-otp',
          params: { target: email.trim().toLowerCase(), purpose: 'REGISTRATION' }
        } as never)
        return
      }

      // Backend signals MFA is required (typically 401 with MFA-related message)
      if (
        typeof axiosMsg === 'string' &&
        (axiosMsg.toLowerCase().includes('mfa') ||
          axiosMsg.toLowerCase().includes('totp') ||
          axiosMsg.toLowerCase().includes('two-factor') ||
          axiosMsg.toLowerCase().includes('authenticator'))
      ) {
        setMfaRequired(true)
        setErrors({ totp: 'Enter the code from your authenticator app' })
        return
      }

      Alert.alert('Login Failed', axiosMsg ?? 'Please check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardView>
      <StatusBar style="dark" />
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
            editable={!mfaRequired}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })) }}
            error={errors.password}
            secureTextEntry
            returnKeyType={mfaRequired ? 'next' : 'done'}
            onSubmitEditing={handleLogin}
            editable={!mfaRequired}
          />

          {/* MFA TOTP step — shown after credentials are accepted but MFA required */}
          {mfaRequired && (
            <View>
              <View
                style={[
                  styles.mfaBanner,
                  {
                    backgroundColor: COLORS.accent.primaryMuted,
                    borderColor: COLORS.accent.primary,
                    borderRadius: 8,
                    padding: spacing[3],
                    marginBottom: spacing[2],
                    borderWidth: 1,
                  },
                ]}
              >
                <Text variant="bodySmall" color={COLORS.accent.primary}>
                  🔐 Two-factor authentication is enabled on your account.
                </Text>
              </View>
              <Input
                label="Authenticator Code"
                value={totpCode}
                onChangeText={(t) => {
                  const cleaned = t.replace(/\D/g, '').slice(0, 6)
                  setTotpCode(cleaned)
                  setErrors((e) => ({ ...e, totp: undefined }))
                }}
                error={errors.totp}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                placeholder="6-digit code"
                autoComplete="one-time-code"
                autoFocus={mfaRequired}
              />
            </View>
          )}

          {!mfaRequired && (
            <Pressable
              onPress={() => router.push('/auth/forgot')}
              accessibilityRole="link"
              style={{ alignSelf: 'flex-end' }}
            >
              <Text variant="label" color={COLORS.accent.primary}>
                Forgot password?
              </Text>
            </Pressable>
          )}
        </View>

        {/* Actions */}
        <View style={[styles.actions, { gap: spacing[3], marginTop: spacing[6] }]}>
          <Button
            fullWidth
            size="lg"
            loading={loading}
            onPress={handleLogin}
            accessibilityLabel={mfaRequired ? 'Verify and sign in' : 'Sign in'}
          >
            {mfaRequired ? 'Verify & Sign In' : 'Sign In'}
          </Button>

          {mfaRequired && (
            <Button
              fullWidth
              variant="ghost"
              onPress={() => {
                setMfaRequired(false)
                setTotpCode('')
                setErrors({})
              }}
              accessibilityLabel="Back to credentials"
            >
              ← Back
            </Button>
          )}
        </View>

        {/* Register link */}
        {!mfaRequired && (
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
        )}
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
  mfaBanner: {},
})
