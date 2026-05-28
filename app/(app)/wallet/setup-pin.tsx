/**
 * Setup PIN screen — set or change the user's wallet transaction PIN.
 * Route params: ?mode=setup|change
 *
 * Setup mode  → Enter PIN → Confirm PIN → POST /wallet/pin
 * Change mode → Enter current PIN → Enter new PIN → Confirm → PUT /wallet/pin
 *
 * Uses the existing PinInput component (4-dot, same as transfer flow).
 */

import React, { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSequence, Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import Svg, { Path, Circle } from 'react-native-svg'
import { Text } from '../../../src/components/ui/Text'
import { Button } from '../../../src/components/ui/Button'
import { PinInput } from '../../../src/components/ui/PinInput'
import { useWalletPin } from '../../../src/hooks/useWalletPin'
import { useAuth } from '../../../src/hooks/useAuth'
import { useTheme } from '../../../src/hooks/useTheme'
import { spacing } from '../../../src/theme/spacing'

// ─── Step definitions ─────────────────────────────────────────────────────────

type SetupStep = 'new-pin' | 'confirm-pin' | 'success'
type ChangeStep = 'current-pin' | 'new-pin' | 'confirm-pin' | 'success'

type Mode = 'setup' | 'change'

// ─── Success checkmark ────────────────────────────────────────────────────────

function SuccessState({ onDone }: { onDone: () => void }) {
  const { COLORS } = useTheme()
  const scale = useSharedValue(0)
  const opacity = useSharedValue(0)

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.2, { duration: 300, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 150 }),
    )
    opacity.value = withTiming(1, { duration: 400 })
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }, [opacity, scale])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <View style={styles.successContainer}>
      <Animated.View style={animStyle}>
        <View style={[styles.checkCircle, { backgroundColor: COLORS.status.successMuted }]}>
          <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke={COLORS.status.success} strokeWidth={1.5} />
            <Path d="M8 12l3 3 5-6" stroke={COLORS.status.success} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
      </Animated.View>
      <Text variant="h2" style={{ color: COLORS.text.primary, textAlign: 'center' }}>
        PIN Set Successfully
      </Text>
      <Text variant="body" style={{ color: COLORS.text.secondary, textAlign: 'center' }}>
        Your wallet is now secured with a PIN
      </Text>
      <Button variant="primary" fullWidth onPress={onDone}>
        Done
      </Button>
    </View>
  )
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  const { COLORS } = useTheme()
  return (
    <View style={styles.stepRow}>
      {steps.map((label, i) => (
        <View key={label} style={styles.stepItem}>
          <View style={[
            styles.stepDot,
            { backgroundColor: i <= current ? COLORS.accent.primary : COLORS.border.default },
          ]} />
          <Text variant="caption" style={{ color: i === current ? COLORS.accent.primary : COLORS.text.tertiary, fontSize: 10 }}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SetupPinScreen() {
  const { mode, walletId, isOptional } = useLocalSearchParams<{ mode: Mode; walletId?: string; isOptional?: string }>()
  const router = useRouter()
  const { COLORS } = useTheme()
  const { setupPin, changePin, isLoading, error, clearError } = useWalletPin()
  const { setIsPinSet } = useAuth()

  const isChange = mode === 'change'

  const [currentStep, setCurrentStep] = useState(0)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)

  // Setup steps: new → confirm → success
  // Change steps: current → new → confirm → success
  const setupSteps: SetupStep[] = ['new-pin', 'confirm-pin', 'success']
  const changeSteps: ChangeStep[] = ['current-pin', 'new-pin', 'confirm-pin', 'success']
  const allSteps = isChange ? changeSteps : setupSteps

  const stepLabels = isChange
    ? ['Current', 'New PIN', 'Confirm', 'Done']
    : ['New PIN', 'Confirm', 'Done']

  const currentLabel = allSteps[currentStep]
  const isSuccessStep = currentLabel === 'success'

  // Sync hook error into local error state
  useEffect(() => {
    if (error) setPinError(error)
  }, [error])

  const handlePinComplete = useCallback(async (pin: string) => {
    setPinError(null)
    clearError()

    if (isChange) {
      if (currentLabel === 'current-pin') {
        // Just store the current PIN, move to new PIN step
        setCurrentPin(pin)
        setCurrentStep((s) => s + 1)
      } else if (currentLabel === 'new-pin') {
        setNewPin(pin)
        setCurrentStep((s) => s + 1)
      } else if (currentLabel === 'confirm-pin') {
        if (pin !== newPin) {
          setPinError("PINs don't match — try again")
          setNewPin('')
          setCurrentStep(1) // back to new-pin (index 1 in change mode)
          return
        }
        try {
          await changePin(currentPin, newPin)
          setCurrentStep((s) => s + 1) // success
        } catch {
          // error already set by hook
        }
      }
    } else {
      // Setup mode
      if (currentLabel === 'new-pin') {
        setNewPin(pin)
        setCurrentStep((s) => s + 1)
      } else if (currentLabel === 'confirm-pin') {
        if (pin !== newPin) {
          setPinError("PINs don't match — try again")
          setNewPin('')
          setCurrentStep(0) // back to new-pin
          return
        }
        try {
          await setupPin(newPin)
          setIsPinSet(true)   // user now has a PIN — update auth context
          setCurrentStep((s) => s + 1) // success
        } catch {
          // error already set by hook
        }
      }
    }
  }, [isChange, currentLabel, currentPin, newPin, changePin, setupPin, clearError])

  function getPinTitle() {
    if (currentLabel === 'current-pin') return 'Enter Current PIN'
    if (currentLabel === 'new-pin') return 'Create Your PIN'
    if (currentLabel === 'confirm-pin') return 'Confirm Your PIN'
    return ''
  }

  function getPinSubtitle() {
    if (currentLabel === 'current-pin') return 'Enter your existing 4-digit wallet PIN'
    if (currentLabel === 'new-pin') return 'Choose a 4-digit PIN for your wallet'
    if (currentLabel === 'confirm-pin') return 'Enter your PIN again to confirm'
    return ''
  }

  function handleFinish() {
    if (walletId) {
      router.replace(`/(app)/wallet/${walletId}` as never)
    } else {
      router.back()
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: COLORS.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: spacing[12] }]}>
        {!isSuccessStep && (
          <Pressable
            onPress={() => {
              if (currentStep === 0) router.back()
              else setCurrentStep((s) => s - 1)
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Go back"
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke={COLORS.accent.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
        )}
        <Text variant="h2" style={{ color: COLORS.text.primary, flex: 1, textAlign: isSuccessStep ? 'center' : 'left' }}>
          {isChange ? 'Change PIN' : 'Setup PIN'}
        </Text>
        {!isSuccessStep && isOptional === 'true' ? (
          <Pressable onPress={handleFinish} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text variant="body" style={{ color: COLORS.accent.primary, fontWeight: '600' }}>Skip</Text>
          </Pressable>
        ) : (
          !isSuccessStep && <View style={{ width: 24 }} />
        )}
      </View>

      {!isSuccessStep && (
        <StepIndicator steps={stepLabels} current={currentStep} />
      )}

      <View style={styles.pinContainer}>
        {isSuccessStep ? (
          <SuccessState onDone={handleFinish} />
        ) : (
          <PinInput
            key={`${currentLabel}-${currentStep}`}
            title={getPinTitle()}
            subtitle={getPinSubtitle()}
            onComplete={handlePinComplete}
            error={pinError}
            loading={isLoading}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    gap: spacing[3],
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[5],
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: { width: 32, height: 4, borderRadius: 2 },
  pinContainer: {
    flex: 1,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
