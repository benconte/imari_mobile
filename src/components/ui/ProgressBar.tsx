/**
 * ProgressBar — animated horizontal progress bar.
 * Reused in savings vault cards, budget category bars, and subscription screens.
 *
 * Color rules (when `color` prop is not explicitly provided):
 *   value >= 100 → COLORS.status.error (red)
 *   value >= 80  → COLORS.status.warning (gold)
 *   else         → COLORS.accent.primary (indigo)
 */

import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { Text } from './Text'
import { useTheme } from '../../hooks/useTheme'

interface ProgressBarProps {
  value: number          // 0–100 percentage
  color?: string
  trackColor?: string
  height?: number
  radius?: number
  animated?: boolean
  showLabel?: boolean
}

export function ProgressBar({
  value,
  color,
  trackColor,
  height = 8,
  radius = 9999,
  animated = true,
  showLabel = false,
}: ProgressBarProps) {
  const { COLORS } = useTheme()
  const capped = Math.min(Math.max(value, 0), 100)
  const progress = useSharedValue(0)

  // Resolve fill color
  const fillColor = color ?? (
    value >= 100
      ? COLORS.status.error
      : value >= 80
        ? COLORS.status.warning
        : COLORS.accent.primary
  )

  useEffect(() => {
    if (animated) {
      progress.value = withTiming(capped / 100, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      })
    } else {
      progress.value = capped / 100
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capped])

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }))

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.track,
          {
            height,
            borderRadius: radius,
            backgroundColor: trackColor ?? COLORS.background.tertiary,
            flex: 1,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            barStyle,
            { height, borderRadius: radius, backgroundColor: fillColor },
          ]}
        />
      </View>
      {showLabel && (
        <Text variant="caption" style={[styles.label, { color: COLORS.text.secondary }]}>
          {Math.round(capped)}%
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { overflow: 'hidden' },
  fill: {},
  label: { minWidth: 36, textAlign: 'right', fontFamily: 'DMMono_400Regular' },
})
