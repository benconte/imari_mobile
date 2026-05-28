/**
 * Wallet detail screen — [id].tsx
 * Shows individual wallet info, month stats, linked resources, and quick actions.
 * Uses wallet data from the dashboard query (no dedicated detail endpoint on backend yet).
 */

import React, { useState } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { Screen } from '../../../src/components/layout/Screen'
import { Text } from '../../../src/components/ui/Text'
import { Button } from '../../../src/components/ui/Button'
import { Badge } from '../../../src/components/ui/Badge'
import { Skeleton } from '../../../src/components/ui/Skeleton'
import { WalletActions } from '../../../src/components/wallet/WalletActions'
import { BalanceCard } from '../../../src/components/wallet/BalanceCard'
import { useWallet } from '../../../src/hooks/useWallet'
import { useTheme } from '../../../src/hooks/useTheme'
import { formatCurrency } from '../../../src/lib/utils/currency'
import { spacing } from '../../../src/theme/spacing'
import { radius } from '../../../src/theme/radius'
import type { WalletAction } from '../../../src/types/wallet.types'

export default function WalletDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { COLORS } = useTheme()
  const {
    allWallets, recentTransactions, isLoadingWallet, refetch,
    isBalanceVisible, hideBalance, requestShowBalance, unlockBalance, setPrimaryWallet,
  } = useWallet()

  const [actionsVisible, setActionsVisible] = useState(false)

  const wallet = allWallets.find((w) => w.id === id)

  // Derive month stats from recent transactions (limited — full stats need backend endpoint)
  const monthIn = recentTransactions
    .filter((t) => t.direction === 'CREDIT')
    .reduce((s, t) => s + Number(t.amount), 0)
  const monthOut = recentTransactions
    .filter((t) => t.direction === 'DEBIT')
    .reduce((s, t) => s + Number(t.amount), 0)
  const net = monthIn - monthOut

  async function handleAction(walletId: string, action: WalletAction) {
    setActionsVisible(false)
    switch (action) {
      case 'FUND':
        router.push(`/(app)/wallet/fund?walletId=${walletId}` as never)
        break
      case 'SET_PRIMARY':
        try {
          await setPrimaryWallet(walletId)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        } catch {
          Alert.alert('Error', 'Could not update primary wallet.')
        }
        break
      default:
        break
    }
  }

  if (!isLoadingWallet && !wallet) {
    return (
      <Screen edges={['top', 'left', 'right']} contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text variant="body" style={{ color: COLORS.accent.primary }}>← Back</Text>
        </Pressable>
        <View style={styles.notFound}>
          <Text variant="body" style={{ color: COLORS.text.secondary }}>Wallet not found.</Text>
        </View>
      </Screen>
    )
  }

  return (
    <Screen
      scrollable
      refreshing={isLoadingWallet}
      onRefresh={refetch}
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.accent.primary} />
        </Pressable>
        <Text variant="h2" style={{ color: COLORS.text.primary, flex: 1, textAlign: 'center' }}>
          {wallet?.currency ?? '—'} Wallet
        </Text>
        <Pressable
          onPress={() => setActionsVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Wallet options"
        >
          <Ionicons name="ellipsis-vertical" size={24} color={COLORS.text.secondary} />
        </Pressable>
      </View>

      {/* Balance card */}
      {wallet && (
        <BalanceCard
          balance={wallet.balance}
          currency={wallet.currency}
          walletNumber={wallet.walletNumber}
          isLoading={isLoadingWallet}
          isVisible={isBalanceVisible}
          onHideBalance={hideBalance}
          onRequestShowBalance={requestShowBalance}
          onUnlockBalance={unlockBalance}
          onWalletPress={() => setActionsVisible(true)}
        />
      )}

      {/* Month stats */}
      <View style={[styles.statsCard, { backgroundColor: COLORS.background.secondary, borderColor: COLORS.border.subtle }]}>
        {isLoadingWallet ? (
          <View style={styles.statsRow}>
            <Skeleton width={80} height={40} radius={8} />
            <Skeleton width={80} height={40} radius={8} />
            <Skeleton width={80} height={40} radius={8} />
          </View>
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="caption" style={{ color: COLORS.text.tertiary }}>Month In</Text>
              <Text variant="body" style={{ color: COLORS.status.success, fontFamily: 'DMMono_400Regular', fontWeight: '600' }}>
                +{formatCurrency(monthIn, wallet?.currency ?? 'RWF')}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: COLORS.border.subtle }]} />
            <View style={styles.statItem}>
              <Text variant="caption" style={{ color: COLORS.text.tertiary }}>Month Out</Text>
              <Text variant="body" style={{ color: COLORS.status.error, fontFamily: 'DMMono_400Regular', fontWeight: '600' }}>
                -{formatCurrency(monthOut, wallet?.currency ?? 'RWF')}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: COLORS.border.subtle }]} />
            <View style={styles.statItem}>
              <Text variant="caption" style={{ color: COLORS.text.tertiary }}>Net</Text>
              <Text variant="body" style={{ color: net >= 0 ? COLORS.status.success : COLORS.status.error, fontFamily: 'DMMono_400Regular', fontWeight: '600' }}>
                {net >= 0 ? '+' : ''}{formatCurrency(net, wallet?.currency ?? 'RWF')}
              </Text>
            </View>
          </View>
        )}
        <Text variant="caption" style={{ color: COLORS.text.tertiary, textAlign: 'center', marginTop: spacing[2] }}>
          Based on recent transactions
        </Text>
      </View>

      {/* Linked resources */}
      <View style={styles.section}>
        <Text variant="h3" style={{ color: COLORS.text.primary, marginBottom: spacing[3] }}>
          Linked Resources
        </Text>
        <View style={styles.resourceRow}>
          <Pressable
            style={[styles.resourceChip, { backgroundColor: COLORS.background.secondary, borderColor: COLORS.border.subtle }]}
            onPress={() => router.push('/(app)/(tabs)/cards' as never)}
          >
            <Text variant="label" style={{ color: COLORS.text.secondary }}>💳  Virtual Cards</Text>
            <Badge label="0" variant="neutral" size="sm" />
          </Pressable>
          <Pressable
            style={[styles.resourceChip, { backgroundColor: COLORS.background.secondary, borderColor: COLORS.border.subtle }]}
            onPress={() => router.push('/(app)/(tabs)/savings' as never)}
          >
            <Text variant="label" style={{ color: COLORS.text.secondary }}>🏦  Savings Vaults</Text>
            <Badge label="0" variant="neutral" size="sm" />
          </Pressable>
        </View>
      </View>

      {/* Quick action buttons */}
      <View style={styles.actionButtons}>
        <Button
          variant="primary"
          style={{ flex: 1 }}
          onPress={() => router.push(`/(app)/wallet/fund?walletId=${id}` as never)}
        >
          Fund
        </Button>
        <Button
          variant="secondary"
          style={{ flex: 1 }}
          onPress={() => setActionsVisible(true)}
        >
          More Options
        </Button>
      </View>

      {/* Actions sheet */}
      {wallet && (
        <WalletActions
          wallet={wallet}
          visible={actionsVisible}
          onClose={() => setActionsVisible(false)}
          onAction={handleAction}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[16],
    gap: spacing[4],
  },
  backBtn: { paddingVertical: spacing[2] },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsCard: {
    padding: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
  },
  statDivider: {
    width: 1,
    height: 36,
    marginHorizontal: spacing[2],
  },
  section: {},
  resourceRow: {
    flexDirection: 'column',
    gap: spacing[3],
  },
  resourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
})
