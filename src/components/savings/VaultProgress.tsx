/**
 * VaultProgress — animated circular progress ring for a savings vault.
 * Larger and more prominent than HealthScoreRing.
 * Shows emoji in center, percentage below, and current amount.
 * Animates on mount and pulses when vault is complete.
 */

import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { Text } from '../ui/Text'
import { Skeleton } from '../ui/Skeleton'
import { useTheme } from '../../hooks/useTheme'
import { formatCurrency } from '../../lib/utils/currency'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface VaultProgressProps {
  current: number
  target: number
  currency: string
  size?: number
  strokeWidth?: number
  color?: string
  emoji?: string | null
  isLoading?: boolean
}

export function VaultProgress({
  current,
  target,
  currency,
  size = 160,
  strokeWidth = 12,
  color,
  emoji,
  isLoading = false,
}: VaultProgressProps) {
  const { COLORS } = useTheme()
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0
  const isComplete = percentage >= 100

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  const progress = useSharedValue(0)
  const ringScale = useSharedValue(1)

  const fillColor = color ?? (isComplete ? COLORS.status.success : COLORS.accent.primary)

  useEffect(() => {
    progress.value = withTiming(percentage / 100, {
      duration: 1000,
      easing: Easing.out(Easing.exp),
    })
    if (isComplete) {
      ringScale.value = withSequence(
        withTiming(1.06, { duration: 300 }),
        withSpring(1.0, { damping: 12 }),
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percentage])

  const circleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }))

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }))

  if (isLoading) {
    return <Skeleton width={size} height={size} radius={size / 2} />
  }

  return (
    <Animated.View style={[styles.container, { width: size, height: size }, ringStyle]}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={COLORS.background.tertiary}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={fillColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={circleProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      {/* Center content */}
      <View style={styles.center}>
        {emoji ? (
          <Text style={styles.emoji}>{emoji}</Text>
        ) : null}
        <Text
          variant="h2"
          style={{ color: COLORS.text.primary, fontFamily: 'DMMono_400Regular' }}
        >
          {Math.round(percentage)}%
        </Text>
        <Text
          variant="caption"
          style={{ color: COLORS.text.secondary, fontFamily: 'DMMono_400Regular' }}
        >
          {formatCurrency(current, currency)}
        </Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  emoji: {
    fontSize: 30,
    lineHeight: 36,
  },
})
