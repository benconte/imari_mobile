/**
 * Imari Button component.
 * Variants: primary | secondary | ghost | danger
 * Sizes: sm | md | lg
 * Features: loading state, disabled, haptic feedback, full-width
 */

import React from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../hooks/useTheme'
import { Text } from './Text'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  haptic?: boolean
  fullWidth?: boolean
  children: React.ReactNode
  style?: ViewStyle
}

const HEIGHT: Record<ButtonSize, number> = { sm: 40, md: 52, lg: 60 }
const FONT_SIZE: Record<ButtonSize, number> = { sm: 13, md: 15, lg: 17 }
const H_PADDING: Record<ButtonSize, number> = { sm: 16, md: 20, lg: 24 }

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  haptic = true,
  fullWidth = false,
  children,
  onPress,
  style: outerStyle,
  ...rest
}: ButtonProps) {
  const { COLORS, radius } = useTheme()
  const isDisabled = disabled || loading

  const handlePress: PressableProps['onPress'] = (e) => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    onPress?.(e)
  }

  const containerStyle = [
    styles.base,
    {
      height: HEIGHT[size],
      borderRadius: radius.xl,
      paddingHorizontal: H_PADDING[size],
      ...(fullWidth && { alignSelf: 'stretch' as const }),
      opacity: isDisabled ? 0.5 : 1,
    },
    variant === 'primary' && { backgroundColor: COLORS.accent.primary },
    variant === 'secondary' && {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: COLORS.accent.primary,
    },
    variant === 'ghost' && { backgroundColor: 'transparent' },
    variant === 'danger' && { backgroundColor: COLORS.status.error },
    outerStyle,
  ]

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? COLORS.text.inverse
      : COLORS.accent.primary

  return (
    <Pressable
      style={({ pressed }) => [
        ...containerStyle,
        pressed && !isDisabled && styles.pressed,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#FFF' : COLORS.accent.primary}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          <Text
            variant={size === 'sm' ? 'label' : 'body'}
            color={textColor}
            style={{ fontSize: FONT_SIZE[size], fontFamily: 'DMSans_700Bold' }}
          >
            {children}
          </Text>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
})
