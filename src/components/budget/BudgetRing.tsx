import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  withRepeat,
  withSequence,
  useAnimatedStyle,
} from 'react-native-reanimated'
import { MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '../../hooks/useTheme'
import { Text } from '../ui/Text'
import { Budget } from '../../types/budget.types'
import { formatCurrency } from '../../lib/utils/currency'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface BudgetRingProps {
  budget: Budget | null
  size?: number
  strokeWidth?: number
  isLoading?: boolean
}

export function BudgetRing({
  budget,
  size = 200,
  strokeWidth = 16,
  isLoading = false,
}: BudgetRingProps) {
  const { COLORS, spacing } = useTheme()
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const totalSpent = budget?.totalSpent || 0
  const totalLimit = budget?.totalLimit || 1
  
  // Calculate percentage correctly, capping visual progress at 100% (1.0)
  const actualRatio = totalSpent / totalLimit
  const visualRatio = Math.min(actualRatio, 1)
  const percentage = Math.round(actualRatio * 100)

  // Colors
  let arcColor = COLORS.accent.primary
  if (actualRatio >= 0.8) {
    arcColor = COLORS.status.error
  } else if (actualRatio >= 0.6) {
    arcColor = COLORS.status.warning
  }

  const isExceeded = actualRatio > 1

  // Animation values
  const progress = useSharedValue(0)
  const warningOpacity = useSharedValue(1)

  useEffect(() => {
    progress.value = 0
    progress.value = withTiming(visualRatio, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    })

    if (isExceeded) {
      warningOpacity.value = withRepeat(
        withSequence(withTiming(0.3, { duration: 500 }), withTiming(1.0, { duration: 500 })),
        -1,
        true
      )
    } else {
      warningOpacity.value = 1
    }
  }, [visualRatio, isExceeded])

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - progress.value * circumference
    return {
      strokeDashoffset,
    }
  })

  const animatedWarningStyle = useAnimatedStyle(() => {
    return {
      opacity: warningOpacity.value,
    }
  })

  // Loading state (skeleton)
  if (isLoading || !budget) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <View style={[styles.skeletonCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: COLORS.background.tertiary }]} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.background.tertiary}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={arcColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      
      <View style={styles.centerContent}>
        <Animated.View style={animatedWarningStyle}>
          <Text variant="h1" color={arcColor} style={{ fontSize: 36, fontFamily: 'DMMono-Medium' }}>
            {percentage}%
          </Text>
        </Animated.View>
        <Text variant="caption" color={COLORS.text.tertiary}>
          of budget used
        </Text>
        <View style={[styles.amountRow, { marginTop: spacing[2] }]}>
          <Text variant="caption" color={COLORS.text.primary} style={{ fontFamily: 'DMMono-Medium' }}>
            {formatCurrency(totalSpent, budget.currency)}
          </Text>
          <Text variant="caption" color={COLORS.text.tertiary} style={{ fontFamily: 'DMMono-Medium' }}>
            {' / '}{formatCurrency(totalLimit, budget.currency)}
          </Text>
        </View>
      </View>

      {isExceeded && (
        <View style={[styles.exceededIconContainer, { backgroundColor: COLORS.background.primary }]}>
          <MaterialIcons name="warning" size={24} color={COLORS.status.error} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  skeletonCircle: {
    opacity: 0.5,
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exceededIconContainer: {
    position: 'absolute',
    bottom: -10,
    borderRadius: 20,
    padding: 2,
  },
})
