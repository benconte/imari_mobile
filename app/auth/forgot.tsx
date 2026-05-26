/**
 * Imari Forgot Password Screen.
 * Premium dark auth canvas. Request password reset OTP.
 */

import React, { useState } from 'react'
import {
  Alert,
  StyleSheet,
  View,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '../../src/hooks/useTheme'
import { api } from '../../src/lib/api'
import { Text } from '../../src/components/ui/Text'
import { Input } from '../../src/components/ui/Input'
import { Button } from '../../src/components/ui/Button'
import { KeyboardView } from '../../src/components/layout/KeyboardView'

interface ForgotErrors {
  identifier?: string
}

function validate(identifier: string): ForgotErrors {
  const errors: ForgotErrors = {}
  if (!identifier.trim()) errors.identifier = 'Email or phone is required'
  return errors
}

export default function ForgotScreen() {
  const { COLORS, spacing } = useTheme()

  const [identifier, setIdentifier] = useState('')
  const [errors, setErrors] = useState<ForgotErrors>({})
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    const errs = validate(identifier)
    if (Object.keys(errs).length) {
      setErrors(errs)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      // In a real implementation, this would call an API like:
      // await api.post('/auth/forgot-password', { identifier })
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.push({ 
        pathname: '/auth/verify-otp', 
        params: { target: identifier, purpose: 'RESET_PASSWORD' } 
      })
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      const msg =
        err instanceof Error ? err.message : 'Request failed. Please try again.'
      Alert.alert('Reset Failed', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardView>
      <LinearGradient
        colors={[COLORS.background.primary, COLORS.background.secondary]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.container, { paddingHorizontal: spacing[6] }]}>
        <View style={[styles.headerArea, { marginBottom: spacing[8] }]}>
          <Text variant="display" color={COLORS.text.primary}>
            Reset Password
          </Text>
          <Text variant="bodySmall" color={COLORS.text.secondary} style={{ marginTop: spacing[2] }}>
            Enter your email or phone number and we'll send you an OTP to reset your password.
          </Text>
        </View>

        <View style={[styles.form, { gap: spacing[4] }]}>
          <Input
            label="Email or phone"
            value={identifier}
            onChangeText={(t) => { setIdentifier(t); setErrors((e) => ({ ...e, identifier: undefined })) }}
            error={errors.identifier}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="done"
            autoComplete="email"
            onSubmitEditing={handleReset}
          />
        </View>

        <View style={[styles.actions, { marginTop: spacing[8] }]}>
          <Button
            fullWidth
            size="lg"
            loading={loading}
            onPress={handleReset}
            accessibilityLabel="Send OTP"
          >
            Send OTP
          </Button>

          <Button
            fullWidth
            size="md"
            variant="ghost"
            onPress={() => router.back()}
            accessibilityLabel="Back to login"
            style={{ marginTop: spacing[4] }}
          >
            Back to login
          </Button>
        </View>
      </View>
    </KeyboardView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  headerArea: {},
  form: {},
  actions: {},
})
