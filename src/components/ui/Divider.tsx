/**
 * Divider — horizontal separator line with optional centered label.
 */

import React from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { useTheme } from '../../hooks/useTheme'
import { Text } from './Text'
import { spacing } from '../../theme/spacing'

interface DividerProps {
  label?: string
  style?: StyleProp<ViewStyle>
}

export function Divider({ label, style }: DividerProps) {
  const { COLORS } = useTheme()

  if (!label) {
    return (
      <View
        style={[
          styles.line,
          { backgroundColor: COLORS.border.subtle },
          style,
        ]}
      />
    )
  }

  return (
    <View style={[styles.labeled, style]}>
      <View style={[styles.segment, { backgroundColor: COLORS.border.subtle }]} />
      <Text
        variant="caption"
        color={COLORS.text.tertiary}
        style={{ marginHorizontal: spacing[3] }}
      >
        {label}
      </Text>
      <View style={[styles.segment, { backgroundColor: COLORS.border.subtle }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  line: {
    height: 1,
    width: '100%',
  },
  labeled: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segment: {
    flex: 1,
    height: 1,
  },
})
