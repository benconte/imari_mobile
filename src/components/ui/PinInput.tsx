/**
 * PinInput — 4-dot PIN entry component.
 *
 * - 4-digit PIN to match backend (POST /wallet/transfer expects 4-digit pin)
 * - Shake animation on error using withSequence + withTiming
 * - Clears all dots after shake
 * - Optional biometric shortcut button
 * - Haptics: Medium on digit, Error notification on wrong PIN
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../hooks/useTheme'
import { Text } from './Text'

const PIN_LENGTH = 4
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'BIO', '0', '⌫'] as const
type Key = (typeof KEYS)[number]

interface PinInputProps {
  onComplete: (pin: string) => void
  onBiometric?: () => void
  onClearError?: () => void
  error?: string | null
  loading?: boolean
  title?: string
  subtitle?: string
}

export function PinInput({
  onComplete,
  onBiometric,
  onClearError,
  error,
  loading = false,
  title = 'Enter wallet PIN',
  subtitle,
}: PinInputProps) {
  const { COLORS, spacing, radius, typography } = useTheme()
  const [pin, setPin] = useState('')
  const shakeX = useSharedValue(0)

  const animatedDotsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }))

  // Trigger shake + clear on error
  useEffect(() => {
    if (!error) return
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    shakeX.value = withSequence(
      withTiming(-10, { duration: 60 }),
      withTiming(10, { duration: 60 }),
      withTiming(-10, { duration: 60 }),
      withTiming(10, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    )
    setPin('')
  }, [error, shakeX])

  const handleKey = useCallback(
    (key: Key) => {
      if (loading) return

      if (key === 'BIO') {
        onBiometric?.()
        return
      }

      if (key === '⌫') {
        if (error && onClearError) onClearError()
        setPin((prev) => prev.slice(0, -1))
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        return
      }

      if (error && onClearError) onClearError()
      const nextPin = pin + key
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setPin(nextPin)

      if (nextPin.length === PIN_LENGTH) {
        onComplete(nextPin)
      }
    },
    [pin, loading, onComplete, onBiometric, error, onClearError],
  )

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={styles.header}>
        <Text variant="h2" style={{ color: COLORS.text.primary, textAlign: 'center' }}>
          {title}
        </Text>
        {subtitle && (
          <Text
            variant="body"
            style={{
              color: COLORS.text.secondary,
              textAlign: 'center',
              marginTop: spacing[2],
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* Dots */}
      <Animated.View style={[styles.dots, animatedDotsStyle]}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => {
          const filled = i < pin.length
          const hasError = !!error

          return (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: hasError
                    ? COLORS.status.error
                    : filled
                    ? COLORS.accent.primary
                    : 'transparent',
                  borderColor: hasError
                    ? COLORS.status.error
                    : filled
                    ? COLORS.accent.primary
                    : COLORS.border.default,
                  borderRadius: radius.full,
                },
              ]}
            />
          )
        })}
      </Animated.View>

      {/* Error message */}
      {error && (
        <Text
          variant="caption"
          style={{ color: COLORS.status.error, textAlign: 'center', marginTop: spacing[2] }}
        >
          {error}
        </Text>
      )}

      {/* Keypad */}
      <View style={[styles.keypad, { gap: spacing[2] }]}>
        {[0, 1, 2, 3].map((row) => (
          <View key={row} style={[styles.keyRow, { gap: spacing[2] }]}>
            {KEYS.slice(row * 3, row * 3 + 3).map((key) => {
              const isBio = key === 'BIO'
              const isBack = key === '⌫'
              const showBio = isBio && !!onBiometric
              const hideBio = isBio && !onBiometric

              if (hideBio) {
                return <View key={key} style={styles.key} />
              }

              return (
                <Pressable
                  key={key}
                  onPress={() => handleKey(key)}
                  disabled={loading || (isBio && !onBiometric)}
                  style={({ pressed }) => [
                    styles.key,
                    {
                      backgroundColor: isBack
                        ? COLORS.background.tertiary
                        : pressed
                        ? COLORS.background.tertiary
                        : COLORS.background.secondary,
                      borderRadius: radius.lg,
                      opacity: loading ? 0.5 : 1,
                    },
                  ]}
                >
                  {showBio ? (
                    <Text variant="h2" style={{ color: COLORS.accent.primary, textAlign: 'center' }}>
                      ⁻
                    </Text>
                  ) : (
                    <Text
                      variant="h2"
                      style={{
                        fontFamily: isBack ? undefined : typography.fontFamily.mono,
                        color: isBack ? COLORS.text.secondary : COLORS.text.primary,
                        textAlign: 'center',
                      }}
                    >
                      {key}
                    </Text>
                  )}
                </Pressable>
              )
            })}
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderWidth: 2,
  },
  keypad: {
    paddingBottom: 8,
  },
  keyRow: {
    flexDirection: 'row',
  },
  key: {
    flex: 1,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
