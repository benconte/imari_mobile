/**
 * Imari Lock Screen — app start authentication gate.
 *
 * Shown every time the app is opened from a cold/background state
 * when the user is already authenticated (has a stored token).
 *
 * Priority:
 *  1. If fingerprint unlock enabled + biometrics available → prompt immediately
 *  2. If wallet PIN set → show PIN keypad
 *  3. If neither → pass through (edge case: new user who hasn't set a PIN yet)
 *
 * On success → calls setLocallyVerified(true) → index.tsx redirects to app.
 */

import React, { useCallback, useEffect, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import * as LocalAuthentication from 'expo-local-authentication'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../src/hooks/useTheme'
import { useAuth } from '../src/hooks/useAuth'
import { useWalletPin } from '../src/hooks/useWalletPin'
import { storage } from '../src/lib/storage'
import { STORAGE_KEYS } from '../src/lib/constants'
import { PinInput } from '../src/components/ui/PinInput'
import { Text } from '../src/components/ui/Text'
import { Button } from '../src/components/ui/Button'

type LockMethod = 'biometrics' | 'pin' | 'passthrough'

export default function LockScreen() {
  const { COLORS, spacing } = useTheme()
  const insets = useSafeAreaInsets()
  const { isPinSet, setLocallyVerified, logout, user } = useAuth()
  const { verifyPin, isLoading: isVerifyingPin } = useWalletPin()

  const [method, setMethod] = useState<LockMethod | null>(null)
  const [pinError, setPinError] = useState<string | null>(null)
  const [storedPin, setStoredPin] = useState<string | null>(null)
  const [biometricsAvailable, setBiometricsAvailable] = useState(false)

  // Determine which method to use and initialise
  useEffect(() => {
    const init = async () => {
      const [biometricsEnabled, savedPin] = await Promise.all([
        storage.get(STORAGE_KEYS.BIOMETRICS_ENABLED),
        storage.get(STORAGE_KEYS.IS_PIN_SET_KEY),
      ])

      const hasDevice = await LocalAuthentication.hasHardwareAsync()
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()
      const canUseBio = hasDevice && isEnrolled
      setBiometricsAvailable(canUseBio)

      const wantsBio = biometricsEnabled === 'true' && canUseBio

      if (wantsBio) {
        setMethod('biometrics')
      } else if (isPinSet || savedPin === 'true') {
        // Load stored PIN hash for local comparison
        const pinHash = await storage.get('imari_app_pin_hash')
        setStoredPin(pinHash)
        setMethod('pin')
      } else {
        // No lock method set — pass through (e.g. first login before KYC)
        setMethod('passthrough')
      }
    }
    init()
  }, [isPinSet])

  // Auto-trigger biometric prompt once method is known
  useEffect(() => {
    if (method === 'biometrics') {
      promptBiometrics()
    } else if (method === 'passthrough') {
      setLocallyVerified(true)
      router.replace('/' as never)
    }
  }, [method]) // eslint-disable-line react-hooks/exhaustive-deps

  const promptBiometrics = useCallback(async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Imari',
        cancelLabel: 'Use PIN instead',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
      })

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        setLocallyVerified(true)
        router.replace('/' as never)
      } else if (result.error === 'user_cancel' || result.error === 'system_cancel') {
        // User cancelled — fall back to PIN if available
        if (isPinSet) {
          const pinHash = await storage.get('imari_app_pin_hash')
          setStoredPin(pinHash)
          setMethod('pin')
        }
      } else {
        // Other failure — stay on biometrics, show retry button
      }
    } catch {
      // Hardware error — fall back to PIN
      if (isPinSet) {
        setMethod('pin')
      }
    }
  }, [isPinSet, setLocallyVerified])

  const handlePinComplete = useCallback(
    async (pin: string) => {
      setPinError(null)

      try {
        const isValid = await verifyPin(pin)
        if (isValid) {
          await storage.set('imari_app_pin_hash', pin)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          setLocallyVerified(true)
          router.replace('/' as never)
          return
        }
      } catch {
        // Fallback to local storage below if network fails
      }

      // Offline fallback or invalid pin
      if (storedPin) {
        if (pin === storedPin) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          setLocallyVerified(true)
          router.replace('/' as never)
          return
        } else {
          setPinError('Incorrect PIN. Try again.')
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          return
        }
      }

      setPinError('Incorrect PIN. Try again.')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    },
    [storedPin, setLocallyVerified, verifyPin],
  )

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout()
          router.replace('/auth/login' as never)
        },
      },
    ])
  }

  // Loading state while determining method
  if (method === null) return null

  return (
    <>
      <StatusBar style="light" />
      <LinearGradient
        colors={[COLORS.background.primary, COLORS.background.secondary]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.container, { paddingHorizontal: spacing[6], paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, spacing[6]) }]}>
        {/* Wordmark */}
        <View style={[styles.wordmark, { marginBottom: spacing[8] }]}>
          <Text variant="display" color={COLORS.text.primary}>
            ima<Text variant="display" color={COLORS.accent.primary}>ri</Text>
          </Text>
          {user && (
            <Text variant="bodySmall" color={COLORS.text.secondary} style={{ marginTop: spacing[1] }}>
              Welcome back, {user.firstName}
            </Text>
          )}
        </View>

        {/* PIN mode */}
        {method === 'pin' && (
          <>
            <PinInput
              title="Enter your PIN"
              subtitle="Use your wallet PIN to unlock the app"
              onComplete={handlePinComplete}
              onBiometric={biometricsAvailable ? promptBiometrics : undefined}
              error={pinError}
              onClearError={() => setPinError(null)}
              loading={isVerifyingPin}
            />
          </>
        )}

        {/* Biometrics mode — show retry button if prompt hasn't appeared yet */}
        {method === 'biometrics' && (
          <View style={styles.bioContainer}>
            <Text variant="h2" color={COLORS.text.primary} style={{ textAlign: 'center', marginBottom: spacing[3] }}>
              Unlock Imari
            </Text>
            <Text variant="body" color={COLORS.text.secondary} style={{ textAlign: 'center', marginBottom: spacing[8] }}>
              Use biometrics to unlock
            </Text>
            <Button
              fullWidth
              size="lg"
              onPress={promptBiometrics}
              accessibilityLabel="Unlock with biometrics"
            >
              🔒  Use Biometrics
            </Button>
            {isPinSet && (
              <Button
                fullWidth
                variant="ghost"
                onPress={() => setMethod('pin')}
                style={{ marginTop: spacing[3] }}
                accessibilityLabel="Use PIN instead"
              >
                Use PIN instead
              </Button>
            )}
          </View>
        )}

        {/* Sign out escape hatch */}
        <Button
          fullWidth
          variant="ghost"
          onPress={handleSignOut}
          style={{ marginTop: spacing[4] }}
          accessibilityLabel="Sign out"
        >
          <Text variant="bodySmall" color={COLORS.text.tertiary}>Sign out</Text>
        </Button>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  wordmark: { alignItems: 'center' },
  bioContainer: { alignItems: 'stretch' },
})
