import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { differenceInDays, isPast } from 'date-fns'
import { useTheme } from '../../hooks/useTheme'
import { Text } from '../ui/Text'
import { Card } from '../ui/Card'
import { Chip } from '../ui/Chip'
import { Badge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'
import { Budget } from '../../types/budget.types'
import { formatCurrency } from '../../lib/utils/currency'

interface BudgetSummaryCardProps {
  budget: Budget
  onPress: () => void
  isLoading?: boolean
}

export function BudgetSummaryCard({ budget, onPress, isLoading = false }: BudgetSummaryCardProps) {
  const { COLORS, spacing } = useTheme()

  const { name, period, status, totalLimit, totalSpent, currency, endDate } = budget
  const percentage = (totalSpent / totalLimit) * 100
  const isExceeded = status === 'EXCEEDED' || totalSpent > totalLimit

  let daysRemainingLabel = ''
  if (endDate) {
    const days = Math.max(0, differenceInDays(new Date(endDate), new Date()))
    daysRemainingLabel = `${days} days remaining`
  }

  // Determine period label
  const periodLabel = period.charAt(0).toUpperCase() + period.slice(1).toLowerCase()

  if (isLoading) {
    return (
      <Card variant="default" padding={4} style={{ opacity: 0.5 }}>
        <View style={styles.header}>
          <View style={{ width: 100, height: 20, backgroundColor: COLORS.background.tertiary, borderRadius: 4 }} />
          <View style={{ width: 60, height: 24, backgroundColor: COLORS.background.tertiary, borderRadius: 12 }} />
        </View>
        <View style={{ height: 8, backgroundColor: COLORS.background.tertiary, borderRadius: 4, marginTop: 16 }} />
        <View style={[styles.bottomRow, { marginTop: 12 }]}>
          <View style={{ width: 80, height: 16, backgroundColor: COLORS.background.tertiary, borderRadius: 4 }} />
          <View style={{ width: 60, height: 16, backgroundColor: COLORS.background.tertiary, borderRadius: 4 }} />
        </View>
      </Card>
    )
  }

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card variant="default" padding={4} style={{ marginBottom: spacing[4] }}>
        <View style={styles.header}>
          <Text variant="h3" color={COLORS.text.primary} numberOfLines={1} style={{ flex: 1, marginRight: spacing[2] }}>
            {name}
          </Text>
          <Chip label={periodLabel} size="sm" active={false} />
        </View>

        <View style={styles.progressContainer}>
          <ProgressBar value={percentage} height={8} />
        </View>

        <View style={styles.bottomRow}>
          <Text variant="caption" color={COLORS.text.primary} style={{ fontFamily: 'DMMono-Medium' }}>
            {formatCurrency(totalSpent, currency)} spent
          </Text>
          <Text variant="caption" color={COLORS.text.tertiary} style={{ fontFamily: 'DMMono-Medium' }}>
            of {formatCurrency(totalLimit, currency)}
          </Text>
        </View>

        <View style={styles.footerRow}>
          {isExceeded ? (
            <Badge label="Budget exceeded" variant="error" size="sm" />
          ) : status === 'COMPLETED' ? (
            <Badge label="Completed" variant="neutral" size="sm" />
          ) : (
            <Text variant="caption" color={COLORS.text.tertiary} style={{ alignSelf: 'center' }}>
              {daysRemainingLabel}
            </Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerRow: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
  },
})
