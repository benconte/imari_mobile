/**
 * Skeleton shimmer component.
 * Shimmer sweeps left-to-right on loop using Reanimated + expo-linear-gradient.
 * Exports Skeleton (single) and SkeletonGroup (conditional render).
 */

import React, { useEffect } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle, type DimensionValue } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '../../hooks/useTheme'
import { radius as radiusTokens } from '../../theme/radius'

interface SkeletonProps {
  width: DimensionValue
  height: number
  radius?: number
  style?: StyleProp<ViewStyle>
}

export function Skeleton({ width, height, radius, style }: SkeletonProps) {
  const { isDark } = useTheme()
  const translateX = useSharedValue(-300)

  const shimmerColors = isDark
    ? (['#1E2535', '#2A3347', '#1E2535'] as const)
    : (['#E8ECF0', '#F4F6F8', '#E8ECF0'] as const)

  const baseColor = isDark ? '#1E2535' : '#E8ECF0'

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(300, { duration: 1200, easing: Easing.linear }),
      -1, // infinite
      false,
    )
  }, [translateX])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  const borderRadius = radius ?? radiusTokens.md

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={shimmerColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, width: 300 }}
        />
      </Animated.View>
    </View>
  )
}

interface SkeletonGroupProps {
  visible: boolean
  children: React.ReactNode
  skeleton: React.ReactNode
}

export function SkeletonGroup({ visible, children, skeleton }: SkeletonGroupProps) {
  return <>{visible ? children : skeleton}</>
}
