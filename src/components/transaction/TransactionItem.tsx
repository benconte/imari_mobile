/**
 * TransactionItem — single row in a transaction list.
 * Shows merchant avatar, description, date, and colored amount.
 */

import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { Text } from '../ui/Text'
import { Skeleton } from '../ui/Skeleton'
import { useTheme } from '../../hooks/useTheme'
import { formatTransactionAmount } from '../../lib/utils/currency'
import { relativeDate } from '../../lib/utils/date'
import { spacing } from '../../theme/spacing'
import { radius } from '../../theme/radius'
import type { Transaction } from '../../types/transaction.types'

interface TransactionItemProps {
  transaction: Transaction
  onPress?: (id: string) => void
}

// 6 muted palette colors for merchant initials
const AVATAR_COLORS = [
  '#3B5BDB', '#0CA678', '#C92A2A', '#E67700',
  '#862E9C', '#087F5B',
]

function hashColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const { COLORS } = useTheme()
  const router = useRouter()

  const merchantName = transaction.merchantName ?? transaction.description ?? 'Transaction'
  const initial = merchantName.charAt(0).toUpperCase()
  const avatarColor = hashColor(merchantName)

  const amountColor =
    transaction.direction === 'CREDIT' ? COLORS.status.success : COLORS.status.error

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (onPress) {
      onPress(transaction.id)
    } else {
      router.push(`/(app)/transaction/${transaction.id}` as never)
    }
  }

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text variant="label" style={styles.avatarText}>
          {initial}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text variant="body" style={{ color: COLORS.text.primary }} numberOfLines={1}>
          {merchantName}
        </Text>
        <Text variant="caption" style={{ color: COLORS.text.tertiary }}>
          {relativeDate(transaction.createdAt)}
        </Text>
      </View>

      {/* Amount */}
      <Text variant="mono" style={[styles.amount, { color: amountColor }]}>
        {formatTransactionAmount(transaction.amount, transaction.currency, transaction.direction)}
      </Text>
    </TouchableOpacity>
  )
}

interface TransactionSkeletonItemProps {
  count?: number
}

export function TransactionSkeletonItems({ count = 3 }: TransactionSkeletonItemProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.row}>
          <Skeleton width={48} height={48} radius={radius.full} />
          <View style={[styles.info, { gap: spacing[1] }]}>
            <Skeleton width={120} height={14} />
            <Skeleton width={80} height={12} />
          </View>
          <Skeleton width={72} height={14} />
        </View>
      ))}
    </>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    gap: spacing[3],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  info: {
    flex: 1,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
  },
})
