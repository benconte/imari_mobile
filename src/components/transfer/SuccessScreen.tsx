/**
 * SuccessScreen — shown after a successful transfer.
 * Animated SVG checkmark draws circle then checkmark path.
 * Haptic success fires on mount.
 */

import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated'
import Svg, { Circle, Path } from 'react-native-svg'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../hooks/useTheme'
import { Text } from '../ui/Text'
import { Button } from '../ui/Button'
import type { TransferResult } from '../../types/transfer.types'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)
const AnimatedPath = Animated.createAnimatedComponent(Path)

const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 40 // r=40

interface SuccessScreenProps {
  result: TransferResult
  recipientName: string
  onDone: () => void
  onShareReceipt?: () => void
}

export function SuccessScreen({ result, recipientName, onDone, onShareReceipt }: SuccessScreenProps) {
  const { COLORS, spacing, radius, typography } = useTheme()

  const circleProgress = useSharedValue(CIRCLE_CIRCUMFERENCE)
  const checkProgress = useSharedValue(100)
  const contentOpacity = useSharedValue(0)

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

    // Draw circle (300ms), then checkmark (250ms), then fade in content
    circleProgress.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.quad) })
    checkProgress.value = withDelay(350, withTiming(0, { duration: 250 }))
    contentOpacity.value = withDelay(600, withTiming(1, { duration: 300 }))
  }, [circleProgress, checkProgress, contentOpacity])

  const circleProps = useAnimatedProps(() => ({
    strokeDashoffset: circleProgress.value,
  }))

  const checkProps = useAnimatedProps(() => ({
    strokeDashoffset: checkProgress.value,
  }))

  const contentStyle = {
    opacity: contentOpacity,
  }

  const numericAmount = parseFloat(result.amount || '0')
  const displayAmount = `${result.currency} ${numericAmount.toLocaleString()}`

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background.primary }]}>
      {/* Animated checkmark */}
      <View style={styles.iconContainer}>
        <Svg width={100} height={100} viewBox="0 0 100 100">
          <AnimatedCircle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={COLORS.status.success}
            strokeWidth={4}
            strokeDasharray={CIRCLE_CIRCUMFERENCE}
            animatedProps={circleProps}
            strokeLinecap="round"
            rotation="-90"
            origin="50, 50"
          />
          <AnimatedPath
            d="M 28 50 L 44 66 L 72 34"
            fill="none"
            stroke={COLORS.status.success}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={100}
            animatedProps={checkProps}
          />
        </Svg>
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, contentStyle]}>
        <Text
          style={{
            fontFamily: typography.fontFamily.mono,
            fontSize: 40,
            fontWeight: '700',
            color: COLORS.text.primary,
            textAlign: 'center',
          }}
        >
          {displayAmount}
        </Text>

        <Text
          variant="body"
          style={{ color: COLORS.text.secondary, textAlign: 'center', marginTop: spacing[2] }}
        >
          Sent to {recipientName}
        </Text>

        <Text
          variant="caption"
          style={{ color: COLORS.text.tertiary, textAlign: 'center', marginTop: spacing[2] }}
        >
          Ref: {result.reference}
        </Text>

        {/* Actions */}
        <View style={[styles.actions, { marginTop: spacing[8], gap: spacing[3] }]}>
          {onShareReceipt && (
            <Button variant="secondary" fullWidth onPress={onShareReceipt}>
              Share Receipt
            </Button>
          )}
          <Button variant="primary" fullWidth onPress={onDone}>
            Done
          </Button>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  actions: {
    width: '100%',
  },
})
