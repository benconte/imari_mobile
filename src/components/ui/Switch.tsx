/**
 * Switch — custom animated toggle component.
 * Used in vault lock settings and auto-save rule toggles.
 *
 * Track slides, thumb moves with withSpring.
 * Haptic on every toggle.
 */

import React, { useEffect } from 'react'
import { Pressable, View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Text } from './Text'
import { useTheme } from '../../hooks/useTheme'

interface SwitchProps {
  value: boolean
  onChange: (value: boolean) => void
  label?: string
  disabled?: boolean
}

const TRACK_WIDTH = 50
const TRACK_HEIGHT = 28
const THUMB_SIZE = 22
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - 6  // 22

export function Switch({ value, onChange, label, disabled = false }: SwitchProps) {
  const { COLORS } = useTheme()
  const thumbX = useSharedValue(value ? THUMB_TRAVEL : 0)
  const trackOpacity = useSharedValue(value ? 1 : 0)

  useEffect(() => {
    thumbX.value = withSpring(value ? THUMB_TRAVEL : 0, { damping: 18, stiffness: 200 })
    trackOpacity.value = withTiming(value ? 1 : 0, { duration: 180 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }))

  const trackOnStyle = useAnimatedStyle(() => ({
    opacity: trackOpacity.value,
  }))

  function handlePress() {
    if (disabled) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onChange(!value)
  }

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.row, disabled && styles.disabled]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
    >
      {label && (
        <Text
          variant="body"
          style={{ color: disabled ? COLORS.text.tertiary : COLORS.text.primary, flex: 1 }}
        >
          {label}
        </Text>
      )}
      <View style={[styles.track, { backgroundColor: COLORS.border.default }]}>
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.trackOn,
            trackOnStyle,
            { backgroundColor: COLORS.accent.primary },
          ]}
        />
        <Animated.View
          style={[
            styles.thumb,
            thumbStyle,
            { backgroundColor: '#FFFFFF' },
          ]}
        />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  disabled: { opacity: 0.45 },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  trackOn: {
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
})
