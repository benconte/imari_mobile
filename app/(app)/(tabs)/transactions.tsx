/**
 * Transactions screen — paginated, filterable, date-grouped list.
 * Session 3: full implementation replacing skeleton stub.
 */

import React, { useState } from 'react'
import { RefreshControl, SectionList, StyleSheet, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Screen } from '../../../src/components/layout/Screen'
import { Text } from '../../../src/components/ui/Text'
import { Badge } from '../../../src/components/ui/Badge'
import { EmptyState } from '../../../src/components/ui/EmptyState'
import { TransactionItem, TransactionSkeletonItems } from '../../../src/components/transaction/TransactionItem'
import { TransactionSectionHeader } from '../../../src/components/transaction/TransactionSectionHeader'
import { TransactionFilter } from '../../../src/components/transaction/TransactionFilter'
import { ActiveFiltersRow } from '../../../src/components/transaction/ActiveFiltersRow'
import { useTransactions } from '../../../src/hooks/useTransactions'
import { useTheme } from '../../../src/hooks/useTheme'
import { useWallet } from '../../../src/hooks/useWallet'
import { spacing } from '../../../src/theme/spacing'
import type { TransactionFilters } from '../../../src/types/transaction.types'
import type { Transaction } from '../../../src/types/transaction.types'

// ─── Inline sub-components ────────────────────────────────────────────────────

function TransactionsHeader({
  activeFilterCount,
  onFilterPress,
}: {
  activeFilterCount: number
  onFilterPress: () => void
}) {
  const { COLORS } = useTheme()
  return (
    <View style={styles.header}>
      <Text variant="h1" color={COLORS.text.primary}>Transactions</Text>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onFilterPress()
        }}
        style={styles.filterBtn}
        accessibilityLabel="Open filters"
      >
        <Text style={{ fontSize: 20 }}>⚙</Text>
        {activeFilterCount > 0 && (
          <View style={styles.filterBadge}>
            <Badge label={String(activeFilterCount)} variant="info" dot />
          </View>
        )}
      </TouchableOpacity>
    </View>
  )
}

function FooterLoader() {
  return (
    <View style={{ paddingHorizontal: spacing[4] }}>
      <TransactionSkeletonItems count={3} />
    </View>
  )
}

function TransactionsEmptyState({
  filters,
  clearFilters,
}: {
  filters: TransactionFilters
  clearFilters: () => void
}) {
  const hasFilters = Object.values(filters).some(Boolean)
  return (
    <EmptyState
      title={hasFilters ? 'No matching transactions' : 'No transactions yet'}
      description={
        hasFilters
          ? 'Try adjusting your filters'
          : 'Your transactions will appear here'
      }
      action={
        hasFilters ? { label: 'Clear Filters', onPress: clearFilters } : undefined
      }
    />
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const { COLORS } = useTheme()
  const { wallet } = useWallet()
  const primaryCurrency = wallet?.currency ?? 'RWF'

  const {
    sections,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    filters,
    setFilters,
    clearFilters,
    activeFilterCount,
  } = useTransactions()

  const [filterVisible, setFilterVisible] = useState(false)

  function handleItemPress(id: string) {
    router.push(`/(app)/transaction/${id}` as never)
  }

  function handleEndReached() {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }

  function handleRemoveFilter(key: keyof TransactionFilters) {
    const updated = { ...filters }
    delete updated[key]
    setFilters(updated)
  }

  if (isError) {
    return (
      <Screen scrollable={false}>
        <EmptyState
          title="Something went wrong"
          description="We couldn't load your transactions"
          action={{ label: 'Retry', onPress: refetch }}
        />
      </Screen>
    )
  }

  return (
    <Screen scrollable={false} style={{ paddingHorizontal: 0 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing[4] }}>
        <TransactionsHeader
          activeFilterCount={activeFilterCount}
          onFilterPress={() => setFilterVisible(true)}
        />
      </View>

      {/* Active filter chips */}
      <ActiveFiltersRow
        filters={filters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={clearFilters}
        activeCount={activeFilterCount}
      />

      {/* Loading skeleton */}
      {isLoading ? (
        <View style={{ paddingHorizontal: spacing[4], marginTop: spacing[2] }}>
          <TransactionSkeletonItems count={8} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item: Transaction) => item.id}
          renderItem={({ item }: { item: Transaction }) => (
            <View style={{ paddingHorizontal: spacing[4] }}>
              <TransactionItem transaction={item} onPress={handleItemPress} />
            </View>
          )}
          renderSectionHeader={({ section }) => (
            <TransactionSectionHeader
              label={section.title}
              totalAmount={section.netAmount}
              currency={primaryCurrency}
            />
          )}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isFetchingNextPage ? <FooterLoader /> : null}
          ListEmptyComponent={
            <TransactionsEmptyState filters={filters} clearFilters={clearFilters} />
          }
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={COLORS.accent.primary}
            />
          }
          stickySectionHeadersEnabled
          contentContainerStyle={{ paddingBottom: spacing[16], flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filter bottom sheet */}
      <TransactionFilter
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        currentFilters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters)
          setFilterVisible(false)
        }}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  filterBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
})
