/**
 * Badge — status label with 6 semantic variants.
 * Dot mode renders a 6×6 colored circle (no text).
 */

import React from 'react'
import { StyleSheet, Text as RNText, View } from 'react-native'
import { useTheme } from '../../hooks/useTheme'
import { radius } from '../../theme/radius'

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'gold'
export type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  label: string
  variant: BadgeVariant
  size?: BadgeSize
  dot?: boolean
}

export function Badge({ label, variant, size = 'md', dot = false }: BadgeProps) {
  const { COLORS } = useTheme()

  function resolveColors() {
    switch (variant) {
      case 'success':
        return { bg: COLORS.status.successMuted, text: COLORS.status.success }
      case 'warning':
        return { bg: COLORS.status.warningMuted, text: COLORS.status.warning }
      case 'error':
        return { bg: COLORS.status.errorMuted, text: COLORS.status.error }
      case 'info':
        return { bg: COLORS.status.infoMuted, text: COLORS.status.info }
      case 'gold':
        return { bg: 'rgba(240, 180, 41, 0.12)', text: '#F0B429' }
      default: // neutral
        return { bg: COLORS.background.tertiary, text: COLORS.text.secondary }
    }
  }

  const colors = resolveColors()
  const isSm = size === 'sm'

  if (dot) {
    return (
      <View
        style={[styles.dot, { backgroundColor: colors.text }]}
        accessibilityLabel={label}
      />
    )
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: isSm ? 8 : 10,
          paddingVertical: isSm ? 2 : 4,
        },
      ]}
    >
      <RNText
        style={[
          styles.label,
          { color: colors.text, fontSize: isSm ? 11 : 12 },
        ]}
      >
        {label}
      </RNText>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: 'DMSans_600SemiBold',
    letterSpacing: 0.3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
})
