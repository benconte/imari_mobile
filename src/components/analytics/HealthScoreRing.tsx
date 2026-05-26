/**
 * HealthScoreRing — animated SVG ring showing financial health score 0-100.
 * Animates from 0 to score on mount using strokeDashoffset.
 */

import React, { useEffect } from 'react'
import { View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { Text } from '../ui/Text'
import { Skeleton } from '../ui/Skeleton'
import { useTheme } from '../../hooks/useTheme'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface HealthScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  isLoading?: boolean
}

function getScoreColor(score: number, COLORS: { status: { error: string; warning: string; success: string } }): string {
  if (score <= 40) return COLORS.status.error
  if (score <= 69) return '#F0B429' // gold/warning
  return COLORS.status.success
}

function getScoreMessage(score: number): string {
  if (score >= 70) return 'Your finances are in great shape 🎉'
  if (score >= 41) return 'Some areas need attention'
  return "Let's get your finances on track"
}

export function HealthScoreRing({
  score,
  size = 120,
  strokeWidth = 10,
  isLoading = false,
}: HealthScoreRingProps) {
  const { COLORS } = useTheme()

  const animatedScore = useSharedValue(0)
  const center = size / 2
  const radiusValue = center - strokeWidth / 2
  const circumference = 2 * Math.PI * radiusValue

  useEffect(() => {
    if (!isLoading) {
      animatedScore.value = withTiming(score, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      })
    }
  }, [animatedScore, score, isLoading])

  const animatedProps = useAnimatedProps(() => {
    const progress = animatedScore.value / 100
    const strokeDashoffset = circumference * (1 - progress)
    return { strokeDashoffset }
  })

  if (isLoading) {
    return <Skeleton width={size} height={size} radius={size / 2} />
  }

  const color = getScoreColor(score, COLORS)

  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          {/* Track */}
          <Circle
            cx={center}
            cy={center}
            r={radiusValue}
            stroke={COLORS.background.tertiary}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radiusValue}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
          />
        </Svg>
        {/* Center text */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="monoLg" style={{ color: COLORS.text.primary, fontSize: 22 }}>
            {score}
          </Text>
          <Text variant="caption" style={{ color: COLORS.text.tertiary, fontSize: 10 }}>
            Health Score
          </Text>
        </View>
      </View>
      <Text variant="bodySmall" style={{ color: COLORS.text.secondary, textAlign: 'center' }}>
        {getScoreMessage(score)}
      </Text>
    </View>
  )
}
