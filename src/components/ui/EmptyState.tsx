/**
 * EmptyState — centered empty/zero-results state.
 * Used in every list screen throughout the app.
 */

import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useTheme } from '../../hooks/useTheme'
import { Text } from './Text'
import { Button } from './Button'
import { spacing } from '../../theme/spacing'
import { radius } from '../../theme/radius'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onPress: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const { COLORS } = useTheme()
  const opacity = useSharedValue(0)

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 })
  }, [opacity])

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <View style={[styles.iconContainer, { backgroundColor: COLORS.background.tertiary }]}>
        {icon ?? (
          <Text style={{ fontSize: 36 }}>📭</Text>
        )}
      </View>

      <Text
        variant="h3"
        color={COLORS.text.primary}
        style={{ marginTop: spacing[4], textAlign: 'center' }}
      >
        {title}
      </Text>

      {description && (
        <Text
          variant="body"
          color={COLORS.text.secondary}
          style={{ marginTop: spacing[2], textAlign: 'center', maxWidth: 260 }}
        >
          {description}
        </Text>
      )}

      {action && (
        <Button
          variant="secondary"
          size="sm"
          onPress={action.onPress}
          style={{ marginTop: spacing[5] }}
        >
          {action.label}
        </Button>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
