/**
 * Transaction detail screen — receipt view for a single transaction.
 * Route: /(app)/transaction/[id]
 */

import React from 'react'
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Screen } from '../../../src/components/layout/Screen'
import { Text } from '../../../src/components/ui/Text'
import { Skeleton } from '../../../src/components/ui/Skeleton'
import { EmptyState } from '../../../src/components/ui/EmptyState'
import { TransactionDetail } from '../../../src/components/transaction/TransactionDetail'
import { useTransaction } from '../../../src/hooks/useTransactions'
import { useTheme } from '../../../src/hooks/useTheme'
import { spacing } from '../../../src/theme/spacing'
import { radius } from '../../../src/theme/radius'

// ─── Inline sub-components ────────────────────────────────────────────────────

function DetailHeader() {
  const { COLORS } = useTheme()
  return (
    <View style={[styles.header, { borderBottomColor: COLORS.border.subtle }]}>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          router.back()
        }}
        style={styles.backBtn}
        accessibilityLabel="Go back"
      >
        <Text style={{ fontSize: 24, color: COLORS.text.primary }}>‹</Text>
      </TouchableOpacity>

      <Text variant="h3" color={COLORS.text.primary} style={styles.headerTitle}>
        Transaction
      </Text>

      {/* Spacer to balance header */}
      <View style={styles.backBtn} />
    </View>
  )
}

function DetailSkeleton() {
  const { spacing: s } = useTheme()
  return (
    <View style={{ padding: s[4], gap: s[4] }}>
      <View style={{ alignItems: 'center' }}>
        <Skeleton width={80} height={24} radius={radius.full} />
      </View>
      <View style={{ alignItems: 'center' }}>
        <Skeleton width={200} height={48} />
      </View>
      <View style={{ alignItems: 'center', gap: s[3] }}>
        <Skeleton width={72} height={72} radius={radius.full} />
        <Skeleton width={160} height={20} />
      </View>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} style={styles.skeletonRow}>
          <Skeleton width={80} height={14} />
          <Skeleton width={140} height={14} />
        </View>
      ))}
    </View>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { transaction, isLoading, isError } = useTransaction(id ?? '')

  return (
    <Screen scrollable={false} style={{ paddingHorizontal: 0 }}>
      <DetailHeader />

      {isLoading && <DetailSkeleton />}

      {isError && (
        <EmptyState
          title="Transaction not found"
          description="This transaction may no longer be available"
          action={{ label: 'Go Back', onPress: () => router.back() }}
        />
      )}

      {transaction && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing[10] }}
        >
          <TransactionDetail transaction={transaction} />
        </ScrollView>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
})
