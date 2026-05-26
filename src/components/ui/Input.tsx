/**
 * Imari Input component.
 * Floating label (Reanimated), focus ring, error shake, secure toggle, icon support.
 */

import React, { useCallback, useRef, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useTheme } from '../../hooks/useTheme'
import { Text } from './Text'

interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  secureTextEntry?: boolean
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  secureTextEntry = false,
  value,
  onFocus,
  onBlur,
  onChangeText,
  placeholder,
  ...rest
}: InputProps) {
  const { COLORS, radius, spacing } = useTheme()

  const [isFocused, setIsFocused] = useState(false)
  const [isSecure, setIsSecure] = useState(secureTextEntry)

  const inputRef = useRef<TextInput>(null)

  const hasValue = !!value

  // Floating label animation
  const labelTop = useSharedValue(hasValue ? -8 : 18)
  const labelSize = useSharedValue(hasValue ? 11 : 15)

  // Error shake animation
  const shakeX = useSharedValue(0)

  const labelStyle = useAnimatedStyle(() => ({
    top: labelTop.value,
    fontSize: labelSize.value,
  }))

  const containerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }))

  const animateLabelUp = () => {
    labelTop.value = withTiming(-8, { duration: 160 })
    labelSize.value = withTiming(11, { duration: 160 })
  }

  const animateLabelDown = () => {
    labelTop.value = withTiming(18, { duration: 160 })
    labelSize.value = withTiming(15, { duration: 160 })
  }

  const handleFocus = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      setIsFocused(true)
      animateLabelUp()
      onFocus?.(e)
    },
    [onFocus],
  )

  const handleBlur = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      setIsFocused(false)

      if (!value) {
        animateLabelDown()
      }

      onBlur?.(e)
    },
    [value, onBlur],
  )

  // Keep label floated when value exists
  React.useEffect(() => {
    if (value) {
      animateLabelUp()
    } else if (!isFocused) {
      animateLabelDown()
    }
  }, [value, isFocused])

  // Shake animation on error
  React.useEffect(() => {
    if (error) {
      shakeX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withSpring(0),
      )
    }
  }, [error])

  const borderColor = error
    ? COLORS.status.error
    : isFocused
      ? COLORS.border.focus
      : COLORS.border.default

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.container,
          {
            borderColor,
            borderRadius: radius.lg,
            backgroundColor: COLORS.background.tertiary,

            paddingLeft: leftIcon
              ? spacing[4] + 28 + spacing[2]
              : spacing[4],

            paddingRight:
              secureTextEntry || rightIcon
                ? spacing[4] + 28 + spacing[2]
                : spacing[4],
          },
          containerAnimStyle,
        ]}
      >
        {/* Left Icon */}
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        {/* Floating Label */}
        <Animated.Text
          style={[
            styles.label,
            {
              color: isFocused
                ? COLORS.accent.primary
                : COLORS.text.tertiary,
            },
            labelStyle,
          ]}
        >
          {label}
        </Animated.Text>

        {/* Input */}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              color: COLORS.text.primary,
              fontFamily: 'DMSans_400Regular',
              fontSize: 15,
            },
          ]}
          value={value}
          secureTextEntry={isSecure}
          placeholder={isFocused ? placeholder : ''}
          placeholderTextColor={COLORS.text.tertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChangeText={onChangeText}
          {...rest}
        />

        {/* Password Toggle */}
        {secureTextEntry && (
          <Pressable
            style={styles.rightIcon}
            onPress={() => setIsSecure((prev) => !prev)}
            accessibilityLabel={
              isSecure ? 'Show password' : 'Hide password'
            }
          >
            <Text variant="label" color={COLORS.text.tertiary}>
              {isSecure ? 'Show' : 'Hide'}
            </Text>
          </Pressable>
        )}

        {/* Right Icon */}
        {!secureTextEntry && rightIcon && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </Animated.View>

      {/* Error Text */}
      {error && (
        <Text
          variant="caption"
          color={COLORS.status.error}
          style={styles.errorText}
        >
          {error}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 4,
  },

  container: {
    borderWidth: 1.5,
    height: 60,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  label: {
    position: 'absolute',
    left: 16,
    fontFamily: 'DMSans_400Regular',
    pointerEvents: 'none',
    zIndex: 10,
  },

  input: {
    paddingTop: 20,
    paddingBottom: 6,
    height: '100%',
  },

  leftIcon: {
    position: 'absolute',
    left: 16,
    height: '100%',
    justifyContent: 'center',
    zIndex: 20,
  },

  rightIcon: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
    zIndex: 20,
  },

  errorText: {
    marginLeft: 4,
  },
})
