/**
 * TransactionSectionHeader — sticky date group header for the transaction SectionList.
 * Shows the group label ("Today", "Yesterday", "Dec 12, 2024") and optional net amount.
 */

import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from '../../hooks/useTheme'
import { Text } from '../ui/Text'
import { formatCurrency } from '../../lib/utils/currency'
import { spacing } from '../../theme/spacing'

interface TransactionSectionHeaderProps {
  label: string
  totalAmount?: number
  currency?: string
}

export function TransactionSectionHeader({
  label,
  totalAmount,
  currency = 'RWF',
}: TransactionSectionHeaderProps) {
  const { COLORS } = useTheme()

  const amountColor =
    totalAmount !== undefined
      ? totalAmount >= 0
        ? COLORS.status.success
        : COLORS.status.error
      : undefined

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: COLORS.background.primary },
      ]}
    >
      <Text variant="label" color={COLORS.text.secondary}>
        {label}
      </Text>

      {totalAmount !== undefined && (
        <Text
          variant="mono"
          style={{ fontSize: 13, color: amountColor }}
        >
          {totalAmount >= 0 ? '+' : ''}
          {formatCurrency(Math.abs(totalAmount), currency)}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
  },
})
