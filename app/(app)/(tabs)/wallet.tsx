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
import { Alert, Pressable, StyleSheet, View, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import Svg, { Path, Circle } from 'react-native-svg'
import { Screen } from '../../../src/components/layout/Screen'
import { Text } from '../../../src/components/ui/Text'
import { Button } from '../../../src/components/ui/Button'
import { WalletListCard, WalletListCardSkeleton } from '../../../src/components/wallet/WalletListCard'
import { ActionModal } from '../../../src/components/ui/ActionModal'
import { WalletActions } from '../../../src/components/wallet/WalletActions'
import { useWallet } from '../../../src/hooks/useWallet'
import { useAuth } from '../../../src/hooks/useAuth'
import { useTheme } from '../../../src/hooks/useTheme'
import { spacing } from '../../../src/theme/spacing'
import { radius } from '../../../src/theme/radius'
import type { Wallet, WalletAction } from '../../../src/types/wallet.types'

const MAX_WALLETS = 5

// ─── Icons ────────────────────────────────────────────────────────────────────

function DotsIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="1.5" fill={color} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="19" r="1.5" fill={color} />
    </Svg>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function WalletIndexScreen() {
  const router = useRouter()
  const { COLORS } = useTheme()
  const {
    allWallets,
    isLoadingWallet,
    refetch,
    setPrimaryWallet,
    isBalanceVisible,
    hideBalance,
    requestShowBalance,
    unlockBalance,
  } = useWallet()
  const { isPinSet } = useAuth()

  const [actionsWallet, setActionsWallet] = useState<Wallet | null>(null)
  const [actionsVisible, setActionsVisible] = useState(false)
  const [pinMenuVisible, setPinMenuVisible] = useState(false)

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
    setPinMenuVisible(true)
  }

  // ─── Per-wallet action handler ────────────────────────────────────────────

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

  // ─── PIN route helper ────────────────────────────────────────────────────────

  function navigateToPinSetup() {
    const pinRoute = isPinSet
      ? '/(app)/wallet/setup-pin?mode=change'
      : '/(app)/wallet/setup-pin?mode=setup'
    router.push(pinRoute as never)
  }

  // ─── Wallet count summary label ───────────────────────────────────────────

  const walletCountLabel = isLoadingWallet ? '—' : String(allWallets.length)

  return (
    <Screen
      scrollable
      refreshing={isLoadingWallet}
      onRefresh={refetch}
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.content}
    >
      {/* ── Header ── */}
      <View style={styles.header}>


        <Text variant="h2" style={{ color: COLORS.text.primary, flex: 1 }}>
          My Wallets
        </Text>

        <View style={styles.headerRight}>
          {/* Wallet count badge */}
          <View style={[styles.countBadge, { backgroundColor: COLORS.accent.primaryMuted }]}>
            <Text
              variant="caption"
              style={{ color: COLORS.accent.primary, fontFamily: 'DMSans_700Bold' }}
            >
              {walletCountLabel}
            </Text>
          </View>

          {/* PIN menu */}
          <TouchableOpacity
            onPress={handlePinMenuPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="PIN settings"
          >
            <DotsIcon color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Wallet list ── */}
      <View style={styles.list}>
        {isLoadingWallet ? (
          <>
            <WalletListCardSkeleton />
            <WalletListCardSkeleton />
          </>
        ) : allWallets.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="body" style={{ color: COLORS.text.secondary, textAlign: 'center' }}>
              No wallets found. Create your first wallet below.
            </Text>
          </View>
        ) : (
          allWallets.map((wallet) => (
            <WalletListCard
              key={wallet.id}
              wallet={wallet}
              onPress={(id) => router.push(`/(app)/wallet/${id}` as never)}
              onMorePress={openActions}
              isBalanceVisible={isBalanceVisible}
              onHideBalance={hideBalance}
              onRequestShowBalance={requestShowBalance}
              onUnlockBalance={unlockBalance}
            />
          ))
        )}
      </View>

      {/* ── Add wallet ── */}
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

      {/* ── Actions sheet ── */}
      <WalletActions
        wallet={actionsWallet}
        visible={actionsVisible}
        onClose={() => setActionsVisible(false)}
        onAction={handleAction}
      />

      {/* ── PIN management modal ── */}
      <ActionModal
        visible={pinMenuVisible}
        onClose={() => setPinMenuVisible(false)}
        title="PIN Management"
        subtitle="Your PIN secures all wallet transactions."
        options={[
          {
            label: isPinSet ? 'Change PIN' : 'Set PIN',
            icon: '🔐',
            description: isPinSet
              ? 'Update your existing wallet PIN'
              : 'Set a 4-digit PIN to secure your wallet',
            onPress: navigateToPinSetup,
          },
        ]}
      />
    </Screen>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  list: {
    gap: spacing[3],
  },
  empty: {
    padding: spacing[6],
    alignItems: 'center',
  },
  addSection: {
    marginTop: spacing[2],
  },
  maxReached: {
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
})
