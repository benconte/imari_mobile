/**
 * Imari OTP Verification Screen.
 * 6-digit code entry with 60s resend countdown.
 *
 * REGISTRATION purpose: POST /auth/verify-email only returns { message } —
 * no tokens. After verification we redirect to login so the user can sign in
 * and trigger the KYC routing flow.
 */

import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams } from 'expo-router'
import { useTheme } from '../../src/hooks/useTheme'
import { api } from '../../src/lib/api'
import { OTP_RESEND_TIMEOUT_SECONDS } from '../../src/lib/constants'
import { Text } from '../../src/components/ui/Text'
import { Button } from '../../src/components/ui/Button'
import { OTPInput } from '../../src/components/ui/OTPInput'
import { KeyboardView } from '../../src/components/layout/KeyboardView'

export default function VerifyOtpScreen() {
  const { COLORS, spacing } = useTheme()
  const params = useLocalSearchParams<{ target: string; purpose: string }>()
  const target = params.target ?? ''
  const purpose = params.purpose ?? 'REGISTRATION'

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(OTP_RESEND_TIMEOUT_SECONDS)
  const [canResend, setCanResend] = useState(false)

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true)
      return
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown])

  const handleVerify = useCallback(async () => {
    if (otp.length < 6) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }
    setLoading(true)
    try {
      // POST /auth/verify-email → returns { message } only (no tokens)
      await api.post('/auth/verify-email', { email: target, otp })

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      // Redirect to login — the user must sign in to get tokens and
      // trigger the KYC routing guard.
      router.replace({
        pathname: '/auth/login',
        params: { verified: '1' },
      } as never)
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      const axiosMsg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message
      Alert.alert('Verification Failed', axiosMsg ?? 'Invalid code. Please try again.')
      setOtp('')
    } finally {
      setLoading(false)
    }
  }, [otp, target])

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (otp.length === 6) {
      handleVerify()
    }
  }, [otp, handleVerify])

  const handleResend = async () => {
    try {
      await api.post('/auth/resend-otp', { target, purpose })
      setOtp('')
      setCountdown(OTP_RESEND_TIMEOUT_SECONDS)
      setCanResend(false)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {
      Alert.alert('Error', 'Could not resend code. Please try again.')
    }
  }

  return (
    <KeyboardView>
      <View
        style={[
          styles.container,
          { backgroundColor: COLORS.background.primary, paddingHorizontal: spacing[6] },
        ]}
      >
        {/* Header */}
        <View style={{ marginTop: spacing[12], marginBottom: spacing[8] }}>
          <Text variant="h1" color={COLORS.text.primary}>
            Enter code
          </Text>
          <Text variant="body" color={COLORS.text.secondary} style={{ marginTop: spacing[2] }}>
            We sent a 6-digit code to{'\n'}
            <Text variant="body" color={COLORS.text.primary} style={{ fontFamily: 'DMSans_700Bold' }}>
              {target || 'your registered email'}
            </Text>
          </Text>
        </View>

        {/* OTP Input */}
        <View style={{ marginBottom: spacing[8] }}>
          <OTPInput value={otp} onChange={setOtp} disabled={loading} />
        </View>

        {/* Verify button */}
        <Button
          fullWidth
          size="lg"
          loading={loading}
          onPress={handleVerify}
          disabled={otp.length < 6}
          accessibilityLabel="Verify code"
        >
          Verify
        </Button>

        {/* Resend */}
        <View style={[styles.resend, { marginTop: spacing[6] }]}>
          {canResend ? (
            <Pressable onPress={handleResend} accessibilityRole="button">
              <Text variant="body" color={COLORS.accent.primary} style={{ fontFamily: 'DMSans_700Bold' }}>
                Resend code
              </Text>
            </Pressable>
          ) : (
            <Text variant="body" color={COLORS.text.tertiary}>
              Resend in{' '}
              <Text variant="body" color={COLORS.text.secondary}>
                {countdown}s
              </Text>
            </Text>
          )}
        </View>

        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: spacing[4] }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text variant="body" color={COLORS.text.tertiary} style={{ textAlign: 'center' }}>
            ← Back
          </Text>
        </Pressable>
      </View>
    </KeyboardView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  resend: { alignItems: 'center' },
})
