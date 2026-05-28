/**
 * Wallet index — My Wallets list screen.
 * Shows all user wallets, total balance, and wallet actions.
 * Accessible from drawer "My Wallets" item and BalanceCard.
 *
 * ⋮ header menu handles PIN management (user-scoped, not per-wallet):
 *   - "Set PIN" shown when isPinSet=false
 *   - "Change PIN" shown when isPinSet=true
 */

import React, { useState } from 'react'
import { Pressable, StyleSheet, View, Alert, TouchableOpacity, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import Svg, { Path, Circle } from 'react-native-svg'
import { Screen } from '../../../src/components/layout/Screen'
import { Text } from '../../../src/components/ui/Text'
import { Button } from '../../../src/components/ui/Button'
import { Skeleton } from '../../../src/components/ui/Skeleton'
import { WalletCard, WalletCardSkeleton } from '../../../src/components/wallet/WalletCard'
import { WalletActions } from '../../../src/components/wallet/WalletActions'
import { useWallet } from '../../../src/hooks/useWallet'
import { useAuth } from '../../../src/hooks/useAuth'
import { useTheme } from '../../../src/hooks/useTheme'
import { formatCurrency } from '../../../src/lib/utils/currency'
import { spacing } from '../../../src/theme/spacing'
import { radius } from '../../../src/theme/radius'
import type { Wallet, WalletAction } from '../../../src/types/wallet.types'

const MAX_WALLETS = 5

// ─── Icons ───────────────────────────────────────────────────────────────────
function DotsIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="1.5" fill={color} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="19" r="1.5" fill={color} />
    </Svg>
  )
}

export default function WalletIndexScreen() {
  const router = useRouter()
  const { COLORS } = useTheme()
  const { allWallets, isLoadingWallet, refetch, setPrimaryWallet, isSettingPrimary } = useWallet()
  const { isPinSet } = useAuth()

  const [actionsWallet, setActionsWallet] = useState<Wallet | null>(null)
  const [actionsVisible, setActionsVisible] = useState(false)

  const balancesByCurrency = allWallets.reduce((acc, w) => {
    const currency = w.currency || 'RWF'
    acc[currency] = (acc[currency] || 0) + Number(w.balance)
    return acc
  }, {} as Record<string, number>)

  function openActions(walletId: string) {
    const found = allWallets.find((w) => w.id === walletId)
    if (!found) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setActionsWallet(found)
    setActionsVisible(true)
  }

  // ─── Header 3-dots PIN menu ───────────────────────────────────────────────

  function handlePinMenuPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const pinAction = isPinSet ? 'Change PIN' : 'Set PIN'
    const pinRoute = isPinSet ? '/(app)/wallet/setup-pin?mode=change' : '/(app)/wallet/setup-pin?mode=setup'

    Alert.alert('PIN Management', 'Your PIN secures all wallet transactions.', [
      {
        text: pinAction,
        onPress: () => router.push(pinRoute as never),
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  // ─── Per-wallet action handler ─────────────────────────────────────────────

  async function handleAction(walletId: string, action: WalletAction) {
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
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M19 12H5M12 19l-7-7 7-7" stroke={COLORS.accent.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>

        <Text variant="h2" style={{ color: COLORS.text.primary, flex: 1 }}>My Wallets</Text>

        <View style={styles.headerRight}>
          <View style={[styles.countBadge, { backgroundColor: COLORS.accent.primaryMuted }]}>
            <Text variant="caption" style={{ color: COLORS.accent.primary, fontFamily: 'DMSans_700Bold' }}>
              {isLoadingWallet ? '—' : allWallets.length}
            </Text>
          </View>
          {/* 3-dots PIN menu */}
          <TouchableOpacity
            onPress={handlePinMenuPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="PIN settings"
          >
            <DotsIcon color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Total balance horizontal scroll */}
      <View style={styles.totalsSection}>
        <Text variant="caption" style={{ color: COLORS.text.tertiary, marginBottom: spacing[2], marginLeft: spacing[2] }}>
          {Object.keys(balancesByCurrency).length > 1 ? 'Total across currencies' : 'Total Balance'}
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.totalsScroll}
          decelerationRate="fast"
          snapToInterval={232} // 220 + 12 gap
        >
          {isLoadingWallet ? (
            <View style={[styles.totalCardPremium, { backgroundColor: '#15171C', borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
              <Skeleton width={120} height={20} radius={4} style={{ marginBottom: 12 }} />
              <Skeleton width={160} height={40} radius={6} />
            </View>
          ) : Object.keys(balancesByCurrency).length === 0 ? (
            <View style={[styles.totalCardPremium, { backgroundColor: '#15171C', borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
              <Text style={styles.totalCurrencyLabel}>RWF</Text>
              <Text style={styles.totalValue}>{formatCurrency(0, 'RWF').replace('RWF', '').trim()}</Text>
            </View>
          ) : (
            Object.entries(balancesByCurrency).map(([currency, total]) => (
              <View key={currency} style={[styles.totalCardPremium, { backgroundColor: '#15171C', borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
                <Text style={styles.totalCurrencyLabel}>{currency} WALLETS</Text>
                <Text style={styles.totalValue}>{formatCurrency(total, currency).replace(currency, '').trim()}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Wallet list */}
      <View style={styles.list}>
        {isLoadingWallet ? (
          <>
            <WalletCardSkeleton />
            <WalletCardSkeleton />
          </>
        ) : allWallets.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="body" style={{ color: COLORS.text.secondary, textAlign: 'center' }}>
              No wallets found. Create your first wallet below.
            </Text>
          </View>
        ) : (
          allWallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              onPress={(id) => router.push(`/(app)/wallet/${id}` as never)}
              onMorePress={openActions}
            />
          ))
        )}
      </View>

      {/* Add new wallet */}
      <View style={styles.addSection}>
        {allWallets.length >= MAX_WALLETS ? (
          <View style={styles.maxReached}>
            <Text variant="caption" style={{ color: COLORS.text.tertiary, textAlign: 'center' }}>
              Maximum 5 wallets reached
            </Text>
          </View>
        ) : (
          <Button
            variant="secondary"
            fullWidth
            onPress={() => router.push('/(app)/wallet/create' as never)}
          >
            + Add New Wallet
          </Button>
        )}
      </View>

      {/* Per-wallet actions sheet (no PIN here) */}
      <WalletActions
        wallet={actionsWallet}
        visible={actionsVisible}
        onClose={() => setActionsVisible(false)}
        onAction={handleAction}
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  countBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  totalsSection: {
    marginBottom: spacing[2],
  },
  totalsScroll: {
    gap: spacing[3],
    paddingBottom: spacing[4],
  },
  totalCardPremium: {
    padding: spacing[5],
    paddingHorizontal: spacing[6],
    borderRadius: 24,
    borderWidth: 1,
    minWidth: 220,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  totalCurrencyLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 1,
    marginBottom: spacing[2],
  },
  totalValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: 'DMMono_400Regular',
    letterSpacing: -1,
  },
  list: { gap: spacing[3] },
  empty: {
    padding: spacing[6],
    alignItems: 'center',
  },
  addSection: { marginTop: spacing[2] },
  maxReached: {
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
})
