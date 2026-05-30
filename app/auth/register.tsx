/**
 * Imari Register Screen.
 * Full registration form with client-side validation.
 * Rwanda phone format: 07XXXXXXXX
 */

import React, { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { useTheme } from '../../src/hooks/useTheme'
import { api } from '../../src/lib/api'
import { Text } from '../../src/components/ui/Text'
import { Input } from '../../src/components/ui/Input'
import { Button } from '../../src/components/ui/Button'
import { KeyboardView } from '../../src/components/layout/KeyboardView'
import { AxiosError } from 'axios'

interface RegisterErrors {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  password?: string
  confirmPassword?: string
}

interface FormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+[1-9]\d{7,14}$/

function validate(form: FormState): RegisterErrors {
  const errors: RegisterErrors = {}
  if (!form.firstName.trim()) errors.firstName = 'First name is required'
  if (!form.lastName.trim()) errors.lastName = 'Last name is required'
  if (!EMAIL_RE.test(form.email)) errors.email = 'Enter a valid email address'
  if (!PHONE_RE.test("+" + form.phone)) errors.phone = 'Enter phone (+250788000000)'
  if (form.password.length < 8) errors.password = 'Password must be at least 8 characters'
  if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match'
  return errors
}

export default function RegisterScreen() {
  const { COLORS, spacing } = useTheme()
  const [form, setForm] = useState<FormState>({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
  })
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [loading, setLoading] = useState(false)

  const setField = (field: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleRegister = async () => {
    const errs = validate(form)
    if (Object.keys(errs).length) {
      setErrors(errs)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/register', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: "+" + form.phone,
        password: form.password,
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.push({ pathname: '/auth/verify-otp', params: { target: encodeURIComponent(form.email), purpose: 'REGISTRATION' } } as never)
    } catch (err: unknown) {
      console.log(err instanceof AxiosError ? err.response?.data : err)
      if (err instanceof AxiosError) {
        const errData = err.response?.data;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        const msg = errData.message ? errData.message : 'Registration failed. Please try again.'
        Alert.alert('Registration Failed', msg)
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.'
        Alert.alert('Registration Failed', msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardView>
      <ScrollView
        style={{ backgroundColor: COLORS.background.primary }}
        contentContainerStyle={[styles.content, { paddingHorizontal: spacing[6] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Wordmark */}
        <View style={{ marginTop: spacing[12], marginBottom: spacing[8] }}>
          <Text variant="h1" color={COLORS.text.primary}>
            Create account
          </Text>
          <Text variant="body" color={COLORS.text.secondary} style={{ marginTop: spacing[1] }}>
            Join Imari — your intelligent finance companion
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: spacing[3] }}>
          <View style={{ flexDirection: 'row', gap: spacing[3] }}>
            <View style={{ flex: 1 }}>
              <Input
                label="First name"
                value={form.firstName}
                onChangeText={setField('firstName')}
                error={errors.firstName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Last name"
                value={form.lastName}
                onChangeText={setField('lastName')}
                error={errors.lastName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          </View>

          <Input
            label="Email address"
            value={form.email}
            onChangeText={setField('email')}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
          />

          <Input
            label="Phone (07XXXXXXXX)"
            value={form.phone}
            onChangeText={setField('phone')}
            error={errors.phone}
            keyboardType="phone-pad"
            returnKeyType="next"
          />

          <Input
            label="Password"
            value={form.password}
            onChangeText={setField('password')}
            error={errors.password}
            secureTextEntry
            returnKeyType="next"
          />

          <Input
            label="Confirm password"
            value={form.confirmPassword}
            onChangeText={setField('confirmPassword')}
            error={errors.confirmPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />
        </View>

        {/* CTA */}
        <Button
          fullWidth
          size="lg"
          loading={loading}
          onPress={handleRegister}
          style={{ marginTop: spacing[6] }}
          accessibilityLabel="Create account"
        >
          Create account
        </Button>

        {/* Login link */}
        <View style={[styles.footer, { marginTop: spacing[6], marginBottom: spacing[8] }]}>
          <Text variant="body" color={COLORS.text.secondary}>Already have an account? </Text>
          <Pressable onPress={() => router.replace({ pathname: '/auth/login' } as never)} accessibilityRole="link">
            <Text variant="body" color={COLORS.accent.primary} style={{ fontFamily: 'DMSans_700Bold' }}>
              Sign in
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardView>
  )
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center' },
})
