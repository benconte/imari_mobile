/**
 * StepIndicator — multi-step flow progress indicator.
 * Used in create vault, create budget, and KYC flows.
 *
 * - Completed step: filled circle with checkmark
 * - Current step: filled circle with number + pulsing ring
 * - Upcoming step: empty circle with step number
 */

import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Path, Polyline } from 'react-native-svg'
import { Text } from './Text'
import { useTheme } from '../../hooks/useTheme'

interface StepIndicatorProps {
  steps: string[]
  currentStep: number  // 0-indexed
}

const DOT_SIZE = 28
const PULSE_SIZE = 40

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const { COLORS } = useTheme()
  const pulseScale = useSharedValue(1)

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 900 }),
        withTiming(1, { duration: 900 }),
      ),
      -1,
      false,
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: 1 - (pulseScale.value - 1) * 2.2,
  }))

  return (
    <View style={styles.container}>
      {steps.map((label, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isUpcoming = index > currentStep

        return (
          <View key={label} style={styles.stepWrapper}>
            {/* Connector line before (except first) */}
            {index > 0 && (
              <View
                style={[
                  styles.line,
                  { backgroundColor: isCompleted || isCurrent ? COLORS.accent.primary : COLORS.border.subtle },
                ]}
              />
            )}

            {/* Dot */}
            <View style={styles.dotContainer}>
              {isCurrent && (
                <Animated.View
                  style={[
                    styles.pulse,
                    pulseStyle,
                    { backgroundColor: COLORS.accent.primary },
                  ]}
                />
              )}
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: isUpcoming ? 'transparent' : COLORS.accent.primary,
                    borderWidth: isUpcoming ? 1.5 : 0,
                    borderColor: COLORS.border.default,
                  },
                ]}
              >
                {isCompleted ? (
                  <CheckIcon color="#FFFFFF" />
                ) : (
                  <Text
                    variant="caption"
                    style={{
                      color: isUpcoming ? COLORS.text.tertiary : '#FFFFFF',
                      fontFamily: 'DMSans_600SemiBold',
                      fontSize: 11,
                    }}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
            </View>

            {/* Label */}
            <Text
              variant="caption"
              style={{
                color: isUpcoming ? COLORS.text.tertiary : COLORS.text.primary,
                marginTop: 6,
                fontSize: 10,
                textAlign: 'center',
              }}
            >
              {label}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    position: 'relative',
  },
  dotContainer: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  pulse: {
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    borderRadius: PULSE_SIZE / 2,
    position: 'absolute',
  },
  line: {
    position: 'absolute',
    top: DOT_SIZE / 2 - 1,
    right: '50%',
    left: '-50%',
    height: 1.5,
  },
})
