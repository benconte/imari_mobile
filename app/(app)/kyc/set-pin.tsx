/**
 * KYC Set PIN — required after successful KYC document submission.
 *
 * Two-step confirmation flow:
 *   Step 1: Enter new PIN
 *   Step 2: Confirm PIN (must match)
 *
 * On success:
 *   - Calls POST /wallet/pin to save on backend
 *   - Calls setIsPinSet(true) in AuthContext
 *   - Navigates to /(app)/kyc-pending
 *
 * Also stores the raw PIN in SecureStore for local lock screen comparison.
 * (This is intentional — the PIN is stored securely in the device's TEE/Secure Enclave
 * via expo-secure-store, which is appropriate for local unlock verification.)
 */

import React, { useCallback, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { useTheme } from '../../../src/hooks/useTheme'
import { useAuth } from '../../../src/hooks/useAuth'
import { useWalletPin } from '../../../src/hooks/useWalletPin'
import { storage } from '../../../src/lib/storage'
import { PinInput } from '../../../src/components/ui/PinInput'
import { Text } from '../../../src/components/ui/Text'
import { Screen } from '../../../src/components/layout/Screen'

type Step = 'enter' | 'confirm'

export default function SetPinScreen() {
  const { COLORS, spacing } = useTheme()
  const { setIsPinSet } = useAuth()
  const { setupPin, isLoading, error, clearError } = useWalletPin()

  const [step, setStep] = useState<Step>('enter')
  const [firstPin, setFirstPin] = useState('')
  const [confirmError, setConfirmError] = useState<string | null>(null)

  const handleEnterComplete = useCallback((pin: string) => {
    setFirstPin(pin)
    setStep('confirm')
  }, [])

  const handleConfirmComplete = useCallback(
    async (pin: string) => {
      if (pin !== firstPin) {
        setConfirmError('PINs do not match. Try again.')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        return
      }

      try {
        await setupPin(pin)
        // Store raw PIN in SecureStore for local lock screen comparison
        await storage.set('imari_app_pin_hash', pin)
        setIsPinSet(true)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        router.replace('/(app)/kyc-pending' as never)
      } catch {
        const msg = error ?? 'Failed to set PIN. Please try again.'
        Alert.alert('PIN Setup Failed', msg)
        setStep('enter')
        setFirstPin('')
        clearError()
      }
    },
    [firstPin, setupPin, setIsPinSet, error, clearError],
  )

  return (
    <Screen style={{ paddingHorizontal: spacing[6] }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: spacing[6], marginBottom: spacing[6] }]}>
        <Text variant="h1" color={COLORS.text.primary}>
          {step === 'enter' ? 'Create Your PIN' : 'Confirm Your PIN'}
        </Text>
        <Text variant="body" color={COLORS.text.secondary} style={{ marginTop: spacing[2] }}>
          {step === 'enter'
            ? 'Set a 4-digit PIN to protect your wallet and unlock the app'
            : 'Enter your PIN again to confirm'}
        </Text>
      </View>

      {/* Step dots */}
      <View style={[styles.stepRow, { marginBottom: spacing[6], gap: spacing[2] }]}>
        {['Set PIN', 'Confirm'].map((label, i) => {
          const isActive = (i === 0 && step === 'enter') || (i === 1 && step === 'confirm')
          const isDone = i === 0 && step === 'confirm'
          return (
            <View key={label} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: isDone
                      ? COLORS.status.success
                      : isActive
                        ? COLORS.accent.primary
                        : COLORS.border.default,
                  },
                ]}
              />
              <Text
                variant="caption"
                color={isActive ? COLORS.accent.primary : COLORS.text.tertiary}
                style={{ marginTop: 4 }}
              >
                {label}
              </Text>
            </View>
          )
        })}
      </View>

      {step === 'enter' && (
        <PinInput
          title="Choose a PIN"
          subtitle="You'll use this to unlock the app and confirm transactions"
          onComplete={handleEnterComplete}
        />
      )}

      {step === 'confirm' && (
        <PinInput
          title="Confirm your PIN"
          onComplete={handleConfirmComplete}
          error={confirmError ?? (error ?? null)}
          onClearError={() => { setConfirmError(null); clearError() }}
          loading={isLoading}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {},
  stepRow: { flexDirection: 'row', justifyContent: 'center' },
  stepItem: { alignItems: 'center', marginHorizontal: 12 },
  stepDot: { width: 10, height: 10, borderRadius: 5 },
})
