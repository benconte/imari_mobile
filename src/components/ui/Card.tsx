/**
 * Imari Card component.
 * variant: 'default' | 'elevated' | 'outlined'
 */

import React from 'react'
import { View, StyleSheet, type ViewProps } from 'react-native'
import { Platform } from 'react-native'
import { useTheme } from '../../hooks/useTheme'
import type { Spacing } from '../../theme/spacing'

export type CardVariant = 'default' | 'elevated' | 'outlined'

interface CardProps extends ViewProps {
  variant?: CardVariant
  padding?: keyof Spacing
}

export function Card({ variant = 'default', padding = 4, style, children, ...rest }: CardProps) {
  const { COLORS, radius, shadows, spacing, isDark } = useTheme()

  const shadowStyle =
    variant === 'elevated'
      ? Platform.select({
          ios: shadows.ios[isDark ? 'dark' : 'light'].md,
          android: shadows.android.md,
          default: {},
        })
      : {}

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: COLORS.card.background,
          borderRadius: radius.xl,
          padding: spacing[padding],
          borderWidth: variant === 'outlined' ? 1 : 0,
          borderColor: COLORS.card.border,
        },
        shadowStyle,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
})
