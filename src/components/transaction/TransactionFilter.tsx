/**
 * TransactionFilter — BottomSheet filter panel for the transactions list.
 * All filter state is local — only committed to parent on "Apply".
 */

import React, { useState } from 'react'
import { ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { Text } from '../ui/Text'
import { useTheme } from '../../hooks/useTheme'
import { spacing } from '../../theme/spacing'
import type {
  TransactionFilters,
  TransactionType,
  SpendingCategory,
  TransactionStatus,
  TransactionDirection,
} from '../../types/transaction.types'

interface TransactionFilterProps {
  visible: boolean
  onClose: () => void
  currentFilters: TransactionFilters
  onApply: (filters: TransactionFilters) => void
}

// ─── Sub-component: one labelled section ─────────────────────────────────────

interface FilterSectionProps {
  title: string
  children: React.ReactNode
}

function FilterSection({ title, children }: FilterSectionProps) {
  const { COLORS } = useTheme()
  return (
    <View style={styles.section}>
      <Text variant="label" color={COLORS.text.secondary} style={{ marginBottom: spacing[2] }}>
        {title}
      </Text>
      {children}
    </View>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const DIRECTIONS: { label: string; value: TransactionDirection }[] = [
  { label: 'Money In', value: 'CREDIT' },
  { label: 'Money Out', value: 'DEBIT' },
]

const TYPES: { label: string; value: TransactionType }[] = [
  { label: 'Transfer', value: 'P2P_TRANSFER' },
  { label: 'Deposit', value: 'DEPOSIT' },
  { label: 'Withdrawal', value: 'WITHDRAWAL' },
  { label: 'Merchant', value: 'MERCHANT_PAYMENT' },
  { label: 'Card', value: 'CARD_PAYMENT' },
  { label: 'QR', value: 'QR_PAYMENT' },
  { label: 'Savings', value: 'VAULT_CONTRIBUTION' },
  { label: 'Subscription', value: 'SUBSCRIPTION_CHARGE' },
]

const CATEGORIES: { label: string; value: SpendingCategory }[] = [
  { label: 'Food & Dining', value: 'FOOD_AND_DINING' },
  { label: 'Transport', value: 'TRANSPORT' },
  { label: 'Shopping', value: 'SHOPPING' },
  { label: 'Entertainment', value: 'ENTERTAINMENT' },
  { label: 'Utilities', value: 'UTILITIES' },
  { label: 'Health', value: 'HEALTH' },
  { label: 'Education', value: 'EDUCATION' },
  { label: 'Travel', value: 'TRAVEL' },
  { label: 'Subscriptions', value: 'SUBSCRIPTIONS' },
  { label: 'Transfers', value: 'TRANSFERS' },
  { label: 'Income', value: 'INCOME' },
  { label: 'Savings', value: 'SAVINGS' },
]

const STATUSES: { label: string; value: TransactionStatus }[] = [
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Processing', value: 'PROCESSING' },
]

// ─── Main component ───────────────────────────────────────────────────────────

export function TransactionFilter({
  visible,
  onClose,
  currentFilters,
  onApply,
}: TransactionFilterProps) {
  const { COLORS } = useTheme()
  const [local, setLocal] = useState<TransactionFilters>(currentFilters)

  function toggle<T>(current: T | undefined, value: T): T | undefined {
    return current === value ? undefined : value
  }

  function handleApply() {
    onApply(local)
    onClose()
  }

  function handleClear() {
    setLocal({})
    onApply({})
    onClose()
  }

  // Reset local state when sheet opens
  const handleOpen = () => setLocal(currentFilters)

  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoints={[580]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="h3" color={COLORS.text.primary} style={styles.title}>
          Filter Transactions
        </Text>

        {/* Direction */}
        <FilterSection title="Direction">
          <View style={styles.chipRow}>
            {DIRECTIONS.map(({ label, value }) => (
              <Chip
                key={value}
                label={label}
                active={local.direction === value}
                onPress={() => setLocal((p) => ({ ...p, direction: toggle(p.direction, value) }))}
              />
            ))}
          </View>
        </FilterSection>

        {/* Type */}
        <FilterSection title="Type">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {TYPES.map(({ label, value }) => (
                <Chip
                  key={value}
                  label={label}
                  active={local.type === value}
                  onPress={() => setLocal((p) => ({ ...p, type: toggle(p.type, value) }))}
                />
              ))}
            </View>
          </ScrollView>
        </FilterSection>

        {/* Category */}
        <FilterSection title="Category">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {CATEGORIES.map(({ label, value }) => (
                <Chip
                  key={value}
                  label={label}
                  active={local.category === value}
                  onPress={() => setLocal((p) => ({ ...p, category: toggle(p.category, value) }))}
                />
              ))}
            </View>
          </ScrollView>
        </FilterSection>

        {/* Status */}
        <FilterSection title="Status">
          <View style={styles.chipRow}>
            {STATUSES.map(({ label, value }) => (
              <Chip
                key={value}
                label={label}
                active={local.status === value}
                onPress={() => setLocal((p) => ({ ...p, status: toggle(p.status, value) }))}
              />
            ))}
          </View>
        </FilterSection>

        {/* Date Range */}
        <FilterSection title="Date Range">
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text variant="caption" color={COLORS.text.secondary} style={{ marginBottom: spacing[1] }}>
                From (YYYY-MM-DD)
              </Text>
              <TextInput
                value={local.dateFrom ?? ''}
                onChangeText={(t) => setLocal((p) => ({ ...p, dateFrom: t || undefined }))}
                placeholder="2024-01-01"
                placeholderTextColor={COLORS.text.tertiary}
                style={[styles.dateInput, { color: COLORS.text.primary, borderColor: COLORS.border.default }]}
              />
            </View>
            <View style={styles.dateField}>
              <Text variant="caption" color={COLORS.text.secondary} style={{ marginBottom: spacing[1] }}>
                To (YYYY-MM-DD)
              </Text>
              <TextInput
                value={local.dateTo ?? ''}
                onChangeText={(t) => setLocal((p) => ({ ...p, dateTo: t || undefined }))}
                placeholder="2024-12-31"
                placeholderTextColor={COLORS.text.tertiary}
                style={[styles.dateInput, { color: COLORS.text.primary, borderColor: COLORS.border.default }]}
              />
            </View>
          </View>
        </FilterSection>
      </ScrollView>

      {/* Footer actions */}
      <View style={[styles.footer, { borderTopColor: COLORS.border.subtle }]}>
        <Button variant="ghost" size="md" onPress={handleClear} style={{ flex: 1 }}>
          Clear All
        </Button>
        <Button variant="primary" size="md" onPress={handleApply} style={{ flex: 1 }}>
          Apply
        </Button>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  title: {
    marginBottom: spacing[5],
  },
  section: {
    marginBottom: spacing[5],
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  dateField: {
    flex: 1,
  },
  dateInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing[3],
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
  },
})
