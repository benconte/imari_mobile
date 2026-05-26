/**
 * TransactionDetail — receipt-style display of a single transaction.
 * Used inside app/(app)/transaction/[id].tsx.
 */

import React, { useState } from 'react'
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import * as Sharing from 'expo-sharing'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../hooks/useTheme'
import { Text } from '../ui/Text'
import { Badge } from '../ui/Badge'
import { Divider } from '../ui/Divider'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { formatCurrency, formatTransactionAmount } from '../../lib/utils/currency'
import { fullDate } from '../../lib/utils/date'
import { TRANSACTION_TYPE_LABELS, SPENDING_CATEGORY_LABELS } from '../../types/transaction.types'
import type { TransactionWithDetail } from '../../types/transaction.types'
import type { BadgeVariant } from '../ui/Badge'
import { spacing } from '../../theme/spacing'
import { radius } from '../../theme/radius'

interface TransactionDetailProps {
  transaction: TransactionWithDetail
}

const AVATAR_COLORS = [
  '#3B5BDB', '#0CA678', '#C92A2A', '#E67700', '#862E9C', '#087F5B',
]

function hashColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function statusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case 'COMPLETED': return 'success'
    case 'PENDING':
    case 'PROCESSING':
    case 'REQUIRES_ACTION': return 'warning'
    case 'FAILED':
    case 'CANCELLED': return 'error'
    default: return 'neutral'
  }
}

interface ReceiptRowProps {
  label: string
  children: React.ReactNode
}

function ReceiptRow({ label, children }: ReceiptRowProps) {
  const { COLORS } = useTheme()
  return (
    <View style={styles.receiptRow}>
      <Text variant="caption" color={COLORS.text.secondary} style={styles.receiptLabel}>
        {label}
      </Text>
      <View style={styles.receiptValue}>{children}</View>
    </View>
  )
}

export function TransactionDetail({ transaction }: TransactionDetailProps) {
  const { COLORS } = useTheme()
  const [copied, setCopied] = useState(false)

  const merchantName =
    transaction.merchantName ?? transaction.description ?? 'Transaction'
  const initial = merchantName.charAt(0).toUpperCase()
  const avatarColor = hashColor(merchantName)

  const amountColor =
    transaction.direction === 'CREDIT'
      ? COLORS.status.success
      : COLORS.status.error

  async function handleCopyReference() {
    await Clipboard.setStringAsync(transaction.reference)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleShare() {
    const isAvailable = await Sharing.isAvailableAsync()
    if (!isAvailable) {
      Alert.alert('Share not available', 'Sharing is not available on this device.')
      return
    }
    // Receipt sharing placeholder — Session 11 will generate a PDF receipt
    Alert.alert('Share Receipt', `Reference: ${transaction.reference}`)
  }

  const showFee = transaction.fee > 0

  return (
    <View style={styles.container}>
      {/* Status badge */}
      <View style={styles.centered}>
        <Badge
          label={transaction.status}
          variant={statusBadgeVariant(transaction.status)}
          size="md"
        />
      </View>

      {/* Amount hero */}
      <Text
        variant="display"
        style={[styles.amountHero, { color: amountColor }]}
      >
        {formatTransactionAmount(transaction.amount, transaction.currency, transaction.direction)}
      </Text>

      {/* Merchant avatar */}
      <View style={styles.centered}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text variant="h2" style={{ color: '#FFFFFF' }}>{initial}</Text>
        </View>
        <Text
          variant="h3"
          color={COLORS.text.primary}
          style={{ marginTop: spacing[3], textAlign: 'center' }}
        >
          {merchantName}
        </Text>
      </View>

      {/* Receipt card */}
      <Card variant="outlined" style={{ marginTop: spacing[5] }}>
        <ReceiptRow label="Date">
          <Text variant="body" color={COLORS.text.primary}>
            {fullDate(transaction.createdAt)}
          </Text>
        </ReceiptRow>

        <Divider />

        <ReceiptRow label="Reference">
          <View style={styles.referenceRow}>
            <Text variant="mono" color={COLORS.text.primary} style={styles.referenceText}>
              {transaction.reference}
            </Text>
            <TouchableOpacity onPress={handleCopyReference} hitSlop={8}>
              <Text variant="caption" color={COLORS.accent.primary}>
                {copied ? '✓' : '⎘'}
              </Text>
            </TouchableOpacity>
          </View>
        </ReceiptRow>

        <Divider />

        <ReceiptRow label="Type">
          <Text variant="body" color={COLORS.text.primary}>
            {TRANSACTION_TYPE_LABELS[transaction.type]}
          </Text>
        </ReceiptRow>

        {transaction.category && (
          <>
            <Divider />
            <ReceiptRow label="Category">
              <Text variant="body" color={COLORS.text.primary}>
                {SPENDING_CATEGORY_LABELS[transaction.category]}
              </Text>
            </ReceiptRow>
          </>
        )}

        {showFee && (
          <>
            <Divider />
            <ReceiptRow label="Fee">
              <Text variant="body" color={COLORS.text.primary}>
                {formatCurrency(transaction.fee, transaction.currency)}
              </Text>
            </ReceiptRow>
          </>
        )}

        <Divider />

        <ReceiptRow label="Status">
          <Badge
            label={transaction.status}
            variant={statusBadgeVariant(transaction.status)}
            size="sm"
          />
        </ReceiptRow>
      </Card>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Button
          variant="secondary"
          size="md"
          fullWidth
          onPress={handleCopyReference}
        >
          {copied ? 'Copied!' : 'Copy Reference'}
        </Button>
        <Button
          variant="secondary"
          size="md"
          fullWidth
          onPress={handleShare}
          style={{ marginTop: spacing[3] }}
        >
          Share Receipt
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[10],
  },
  centered: {
    alignItems: 'center',
    marginTop: spacing[4],
  },
  amountHero: {
    textAlign: 'center',
    marginVertical: spacing[3],
    fontSize: 40,
    fontFamily: 'DMMono_400Regular',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  receiptLabel: {
    flex: 1,
  },
  receiptValue: {
    flex: 2,
    alignItems: 'flex-end',
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  referenceText: {
    fontSize: 12,
  },
  actions: {
    marginTop: spacing[5],
  },
})
