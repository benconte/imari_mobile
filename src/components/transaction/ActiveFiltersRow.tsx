/**
 * ActiveFiltersRow — horizontal scroll row of dismissible Chip filters.
 * Animates in/out when filters are applied or cleared.
 */

import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { Chip } from '../ui/Chip'
import { spacing } from '../../theme/spacing'
import type { TransactionFilters } from '../../types/transaction.types'
import {
  TRANSACTION_TYPE_LABELS,
  SPENDING_CATEGORY_LABELS,
} from '../../types/transaction.types'

interface ActiveFiltersRowProps {
  filters: TransactionFilters
  onRemoveFilter: (key: keyof TransactionFilters) => void
  onClearAll: () => void
  activeCount: number
}

export function ActiveFiltersRow({
  filters,
  onRemoveFilter,
  onClearAll,
  activeCount,
}: ActiveFiltersRowProps) {
  const animStyle = useAnimatedStyle(() => ({
    height: withTiming(activeCount > 0 ? 48 : 0, { duration: 220 }),
    opacity: withTiming(activeCount > 0 ? 1 : 0, { duration: 200 }),
  }))

  if (activeCount === 0) {
    return <Animated.View style={animStyle} />
  }

  const chips: { key: keyof TransactionFilters; label: string }[] = []

  if (filters.direction) {
    chips.push({
      key: 'direction',
      label: filters.direction === 'CREDIT' ? 'Money In' : 'Money Out',
    })
  }
  if (filters.type) {
    chips.push({ key: 'type', label: TRANSACTION_TYPE_LABELS[filters.type] })
  }
  if (filters.category) {
    chips.push({ key: 'category', label: SPENDING_CATEGORY_LABELS[filters.category] })
  }
  if (filters.status) {
    chips.push({ key: 'status', label: filters.status })
  }
  if (filters.dateFrom) {
    chips.push({ key: 'dateFrom', label: `From ${filters.dateFrom}` })
  }
  if (filters.dateTo) {
    chips.push({ key: 'dateTo', label: `To ${filters.dateTo}` })
  }

  return (
    <Animated.View style={animStyle}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}
      >
        {chips.map(({ key, label }) => (
          <Chip
            key={key}
            label={label}
            active
            size="sm"
            onRemove={() => onRemoveFilter(key)}
          />
        ))}
        <View style={{ width: spacing[1] }} />
        <Chip
          label="Clear all"
          active
          variant="error"
          size="sm"
          onPress={onClearAll}
        />
      </ScrollView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    alignItems: 'center',
    flexDirection: 'row',
  },
})
