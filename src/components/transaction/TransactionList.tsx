/**
 * TransactionList — recent transactions widget for home screen.
 * Shows up to 5 items. "See all" navigates to transactions tab.
 */

import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { TransactionItem, TransactionSkeletonItems } from './TransactionItem'
import { Text } from '../ui/Text'
import { useTheme } from '../../hooks/useTheme'
import { spacing } from '../../theme/spacing'
import type { Transaction } from '../../types/transaction.types'

interface TransactionListProps {
  transactions: Transaction[]
  isLoading: boolean
  onSeeAll?: () => void
}

export function TransactionList({
  transactions,
  isLoading,
  onSeeAll,
}: TransactionListProps) {
  const { COLORS } = useTheme()
  const router = useRouter()

  function handleSeeAll() {
    if (onSeeAll) {
      onSeeAll()
    } else {
      router.push('/(app)/(tabs)/transactions' as never)
    }
  }

  return (
    <View style={styles.container}>
      {/* Title row */}
      <View style={styles.headerRow}>
        <Text variant="h3" style={{ color: COLORS.text.primary }}>
          Recent Transactions
        </Text>
        <TouchableOpacity onPress={handleSeeAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text variant="label" style={{ color: COLORS.accent.primary }}>
            See all
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading state */}
      {isLoading && <TransactionSkeletonItems count={3} />}

      {/* Empty state */}
      {!isLoading && transactions.length === 0 && (
        <View style={styles.emptyState}>
          <Text variant="body" style={{ color: COLORS.text.tertiary, textAlign: 'center' }}>
            No transactions yet
          </Text>
        </View>
      )}

      {/* Transaction items — max 5 */}
      {!isLoading &&
        transactions.slice(0, 5).map((txn) => (
          <TransactionItem key={txn.id} transaction={txn} />
        ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  emptyState: {
    paddingVertical: spacing[6],
    alignItems: 'center',
  },
})
