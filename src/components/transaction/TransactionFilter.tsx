/**
 * TransactionFilter — BottomSheet filter panel for the transactions list.
 * All filter state is local — only committed to parent on "Apply".
 * Date fields use @react-native-community/datetimepicker for a native picker UX.
 */

import React, { useState, useEffect } from 'react'
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { format } from 'date-fns'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { Text } from '../ui/Text'
import { useTheme } from '../../hooks/useTheme'
import { spacing } from '../../theme/spacing'
import { radius } from '../../theme/radius'
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

// ─── DatePickerField ─────────────────────────────────────────────────────────

interface DatePickerFieldProps {
  label: string
  value: string | undefined      // 'YYYY-MM-DD' or undefined
  onChange: (date: string | undefined) => void
  minimumDate?: Date
  maximumDate?: Date
}

function DatePickerField({ label, value, onChange, minimumDate, maximumDate }: DatePickerFieldProps) {
  const { COLORS } = useTheme()
  const [showPicker, setShowPicker] = useState(false)

  const displayDate = value
    ? format(new Date(value + 'T00:00:00'), 'MMM d, yyyy')
    : 'Any date'

  const pickerDate = value ? new Date(value + 'T00:00:00') : new Date()

  function handleChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setShowPicker(false)
    }
    if (event.type === 'set' && selectedDate) {
      onChange(format(selectedDate, 'yyyy-MM-dd'))
    } else if (event.type === 'dismissed') {
      // User cancelled on Android
    }
  }

  function handleIOSConfirm() {
    setShowPicker(false)
  }

  function handleClear() {
    onChange(undefined)
    setShowPicker(false)
  }

  return (
    <View style={styles.dateFieldWrap}>
      <Text
        variant="caption"
        color={COLORS.text.secondary}
        style={{ marginBottom: spacing[1] }}
      >
        {label}
      </Text>

      {/* Trigger button */}
      <Pressable
        onPress={() => setShowPicker(true)}
        style={[
          styles.dateTrigger,
          {
            borderColor: value ? COLORS.accent.primary : COLORS.border.default,
            backgroundColor: value ? COLORS.accent.primaryMuted : COLORS.background.secondary,
          },
        ]}
      >
        <Text
          variant="bodySmall"
          style={{
            color: value ? COLORS.accent.primary : COLORS.text.secondary,
            fontFamily: value ? 'DMSans_500Medium' : 'DMSans_400Regular',
          }}
        >
          📅 {displayDate}
        </Text>
        {value && (
          <Pressable onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text variant="caption" style={{ color: COLORS.text.tertiary, marginLeft: spacing[2] }}>
              ✕
            </Text>
          </Pressable>
        )}
      </Pressable>

      {/* Android: render picker directly (shows as system dialog) */}
      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {/* iOS: render inline within a styled container */}
      {showPicker && Platform.OS === 'ios' && (
        <View
          style={[
            styles.iosPickerWrap,
            { backgroundColor: COLORS.background.secondary, borderColor: COLORS.border.subtle },
          ]}
        >
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display="spinner"
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            style={{ flex: 1 }}
            textColor={COLORS.text.primary}
          />
          <View style={styles.iosPickerActions}>
            <Pressable onPress={handleClear} style={styles.iosPickerBtn}>
              <Text variant="label" style={{ color: COLORS.text.secondary }}>
                Clear
              </Text>
            </Pressable>
            <Pressable onPress={handleIOSConfirm} style={styles.iosPickerBtn}>
              <Text variant="label" style={{ color: COLORS.accent.primary }}>
                Done
              </Text>
            </Pressable>
          </View>
        </View>
      )}
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

  // Sync local state when the sheet becomes visible
  useEffect(() => {
    if (visible) {
      setLocal(currentFilters)
    }
  }, [visible])

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

  // Parse from date for max constraint on "To" picker
  const fromDateObj = local.dateFrom ? new Date(local.dateFrom + 'T00:00:00') : undefined

  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoints={[640]}>
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

        {/* Date Range — native date pickers */}
        <FilterSection title="Date Range">
          <View style={styles.dateRow}>
            <DatePickerField
              label="From"
              value={local.dateFrom}
              onChange={(d) => setLocal((p) => ({ ...p, dateFrom: d }))}
              maximumDate={local.dateTo ? new Date(local.dateTo + 'T00:00:00') : new Date()}
            />
            <DatePickerField
              label="To"
              value={local.dateTo}
              onChange={(d) => setLocal((p) => ({ ...p, dateTo: d }))}
              minimumDate={fromDateObj}
              maximumDate={new Date()}
            />
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
  dateFieldWrap: {
    flex: 1,
  },
  dateTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    minHeight: 44,
  },
  iosPickerWrap: {
    marginTop: spacing[2],
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  iosPickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  iosPickerBtn: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  footer: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
  },
})
