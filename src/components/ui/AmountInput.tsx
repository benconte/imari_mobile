/**
 * AmountInput — full-screen amount entry with custom numeric keypad.
 *
 * Rules:
 *  - No leading zeros (007 → 7)
 *  - Max 2 decimal places
 *  - Single decimal point only
 *  - Decimal key disabled for RWF (integer currency)
 *  - Scale spring animation on each keystroke
 *  - Haptic on every key press
 */

import React, { useCallback } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../hooks/useTheme'
import { Text } from './Text'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'] as const
type Key = (typeof KEYS)[number]

interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  currency: string
  onCurrencyPress?: () => void
  maxAmount?: number
  label?: string
}

export function AmountInput({
  value,
  onChange,
  currency,
  onCurrencyPress,
  maxAmount,
  label = 'Enter amount',
}: AmountInputProps) {
  const { COLORS, spacing, radius, typography } = useTheme()
  const scale = useSharedValue(1)

  const isRWF = currency === 'RWF'
  const numericValue = parseFloat(value || '0')
  const isOverMax = maxAmount !== undefined && numericValue > maxAmount
  const amountColor = isOverMax ? COLORS.status.error : COLORS.text.primary

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const triggerSpring = useCallback(() => {
    scale.value = 0.95
    scale.value = withSpring(1, { damping: 8, stiffness: 300 })
  }, [scale])

  const handleKey = useCallback(
    (key: Key) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      triggerSpring()

      if (key === '⌫') {
        onChange(value.slice(0, -1))
        return
      }

      if (key === '.') {
        if (isRWF) return
        if (value.includes('.')) return
        onChange(value === '' ? '0.' : value + '.')
        return
      }

      // Digit key
      const next = value + key
      // Prevent leading zeros (but allow "0.")
      if (next.startsWith('0') && !next.startsWith('0.') && next.length > 1) {
        onChange(key)
        return
      }
      // Max 2 decimal places
      const dotIdx = next.indexOf('.')
      if (dotIdx !== -1 && next.length - dotIdx - 1 > 2) return

      onChange(next)
    },
    [value, onChange, isRWF, triggerSpring],
  )

  const displayValue = value === '' ? '0' : value

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text variant="label" style={{ color: COLORS.text.secondary, textAlign: 'center' }}>
        {label}
      </Text>

      {/* Amount display */}
      <View style={styles.amountRow}>
        <Pressable
          onPress={onCurrencyPress}
          disabled={!onCurrencyPress}
          style={[
            styles.currencyPill,
            {
              backgroundColor: COLORS.accent.primaryMuted,
              borderRadius: radius.full,
            },
          ]}
        >
          <Text variant="caption" style={{ color: COLORS.accent.primary }}>
            {currency}
          </Text>
        </Pressable>

        <Animated.Text
          style={[
            animatedStyle,
            {
              fontFamily: typography.fontFamily.mono,
              fontSize: 56,
              fontWeight: '700',
              color: amountColor,
              textAlign: 'center',
              marginTop: spacing[2],
            },
          ]}
        >
          {displayValue}
        </Animated.Text>
      </View>

      {isOverMax && (
        <Text
          variant="caption"
          style={{ color: COLORS.status.error, textAlign: 'center', marginTop: spacing[1] }}
        >
          Exceeds available balance
        </Text>
      )}

      {/* Keypad */}
      <View style={[styles.keypad, { gap: spacing[2] }]}>
        {[0, 1, 2, 3].map((row) => (
          <View key={row} style={[styles.keyRow, { gap: spacing[2] }]}>
            {KEYS.slice(row * 3, row * 3 + 3).map((key) => {
              const isDecimal = key === '.'
              const isBackspace = key === '⌫'
              const disabled = isDecimal && isRWF

              return (
                <Pressable
                  key={key}
                  onPress={() => handleKey(key)}
                  disabled={disabled}
                  style={({ pressed }) => [
                    styles.key,
                    {
                      backgroundColor: isBackspace
                        ? COLORS.background.tertiary
                        : pressed
                        ? COLORS.background.secondary
                        : COLORS.background.secondary,
                      borderRadius: radius.lg,
                      opacity: disabled ? 0.3 : 1,
                    },
                  ]}
                >
                  <Text
                    variant="h2"
                    style={{
                      color: isBackspace ? COLORS.text.secondary : COLORS.text.primary,
                      textAlign: 'center',
                    }}
                  >
                    {key}
                  </Text>
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
  amountRow: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  currencyPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'center',
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
