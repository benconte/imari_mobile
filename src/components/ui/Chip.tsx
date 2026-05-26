/**
 * Chip — pill-shaped filter tag / status label.
 * Used for active filters, category labels, and status indicators.
 */

import React from 'react'
import { Pressable, StyleSheet, Text as RNText, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../hooks/useTheme'
import { radius } from '../../theme/radius'
import { spacing } from '../../theme/spacing'

export type ChipVariant = 'default' | 'success' | 'warning' | 'error' | 'info'
export type ChipSize = 'sm' | 'md'

interface ChipProps {
  label: string
  onRemove?: () => void
  onPress?: () => void
  active?: boolean
  variant?: ChipVariant
  size?: ChipSize
}

export function Chip({
  label,
  onRemove,
  onPress,
  active = false,
  variant = 'default',
  size = 'md',
}: ChipProps) {
  const { COLORS } = useTheme()

  // Resolve colors based on variant + active state
  function resolveColors() {
    if (!active) {
      return {
        bg: COLORS.background.tertiary,
        text: COLORS.text.secondary,
        border: COLORS.border.default,
      }
    }
    switch (variant) {
      case 'success':
        return { bg: COLORS.status.successMuted, text: COLORS.status.success, border: COLORS.status.success }
      case 'warning':
        return { bg: COLORS.status.warningMuted, text: COLORS.status.warning, border: COLORS.status.warning }
      case 'error':
        return { bg: COLORS.status.errorMuted, text: COLORS.status.error, border: COLORS.status.error }
      case 'info':
        return { bg: COLORS.status.infoMuted, text: COLORS.status.info, border: COLORS.status.info }
      default:
        return {
          bg: COLORS.accent.primaryMuted,
          text: COLORS.accent.primary,
          border: COLORS.accent.primary,
        }
    }
  }

  const colors = resolveColors()
  const isSm = size === 'sm'

  const containerStyle = {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    paddingHorizontal: isSm ? 10 : 14,
    paddingVertical: isSm ? 4 : 6,
  }

  const textStyle = {
    color: colors.text,
    fontSize: isSm ? 11 : 13,
    fontFamily: 'DMSans_500Medium',
  }

  function handlePress() {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onPress()
    }
  }

  function handleRemove() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onRemove?.()
  }

  const Wrapper = onPress ? Pressable : View

  return (
    <Wrapper
      onPress={onPress ? handlePress : undefined}
      style={[styles.chip, containerStyle]}
    >
      <RNText style={textStyle} numberOfLines={1}>{label}</RNText>
      {onRemove && (
        <Pressable onPress={handleRemove} style={styles.removeBtn} hitSlop={8}>
          <RNText style={[textStyle, styles.removeIcon]}>×</RNText>
        </Pressable>
      )}
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  removeBtn: {
    marginLeft: spacing[1],
  },
  removeIcon: {
    fontSize: 16,
    lineHeight: 18,
  },
})
