/**
 * Home screen — Imari wallet dashboard.
 * Phase 9: full implementation replacing the Session 1 skeleton.
 * Inline components: HomeHeader (<30 lines), HealthScoreSection (<20 lines).
 * SavingsSnapshotWidget extracted to components/wallet/SavingsSnapshotWidget.tsx.
 */

import React, { useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { Screen } from '../../../src/components/layout/Screen'
import { Text } from '../../../src/components/ui/Text'
import { BalanceCard } from '../../../src/components/wallet/BalanceCard'
import { QuickActions } from '../../../src/components/wallet/QuickActions'
import { WalletSelector } from '../../../src/components/wallet/WalletSelector'
import { SavingsSnapshotWidget } from '../../../src/components/wallet/SavingsSnapshotWidget'
import { TransactionList } from '../../../src/components/transaction/TransactionList'
import { HealthScoreRing } from '../../../src/components/analytics/HealthScoreRing'
import { useWallet } from '../../../src/hooks/useWallet'
import { useAuth } from '../../../src/hooks/useAuth'
import { useTheme } from '../../../src/hooks/useTheme'
import { spacing } from '../../../src/theme/spacing'

// ─── HomeHeader ──────────────────────────────────────────────────────────────
function HomeHeader({ onNotificationPress }: { onNotificationPress: () => void }) {
  const { COLORS } = useTheme()
  const { user } = useAuth()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <View style={styles.header}>
      <Text variant="h2" style={{ color: COLORS.text.primary }}>
        {greeting}, {user?.firstName ?? 'there'} 👋
      </Text>
      <TouchableOpacity onPress={onNotificationPress} accessibilityLabel="Notifications"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
            stroke={COLORS.text.secondary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </TouchableOpacity>
    </View>
  )
}

// ─── HealthScoreSection ──────────────────────────────────────────────────────
function HealthScoreSection({ score, isLoading }: { score: number | null; isLoading: boolean }) {
  const { COLORS } = useTheme()
  return (
    <View style={styles.healthSection}>
      <Text variant="h3" style={{ color: COLORS.text.primary, marginBottom: spacing[3] }}>
        Financial Health
      </Text>
      <HealthScoreRing score={score ?? 0} size={120} strokeWidth={10} isLoading={isLoading || score === null} />
    </View>
  )
}

// ─── HomeScreen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter()
  const [walletSelectorVisible, setWalletSelectorVisible] = useState(false)

  const {
    wallet, allWallets, isLoadingWallet,
    recentTransactions, isLoadingTransactions,
    financialHealthScore, totalSaved, activeVaultsCount,
    isBalanceVisible, toggleBalanceVisibility,
    selectedWalletId, selectWallet, refetch,
  } = useWallet()

  return (
    <>
      <Screen
        scrollable
        refreshing={isLoadingWallet}
        onRefresh={refetch}
        edges={['top', 'left', 'right']}
        contentContainerStyle={styles.scrollContent}
      >
        <HomeHeader onNotificationPress={() => router.push('/(app)/notifications' as never)} />

        <BalanceCard
          balance={wallet?.balance ?? 0}
          currency={wallet?.currency ?? 'RWF'}
          walletNumber={wallet?.walletNumber ?? '0000 0000 0000 0000'}
          isLoading={isLoadingWallet}
          isVisible={isBalanceVisible}
          onToggleVisibility={toggleBalanceVisibility}
          onWalletPress={() => setWalletSelectorVisible(true)}
        />

        <QuickActions
          onSend={() => router.push('/(app)/transfer/send' as never)}
          onReceive={() => router.push('/(app)/qr/show' as never)}
          onTopUp={() => router.push('/(app)/transfer/topup' as never)}
          onScan={() => router.push('/(app)/qr/scan' as never)}
        />

        <SavingsSnapshotWidget
          totalSaved={totalSaved}
          activeVaultsCount={activeVaultsCount}
          isLoading={isLoadingWallet}
          currency={wallet?.currency ?? 'RWF'}
          onPress={() => router.push('/(app)/(tabs)/savings' as never)}
        />

        <HealthScoreSection score={financialHealthScore} isLoading={isLoadingWallet} />

        <TransactionList
          transactions={recentTransactions}
          isLoading={isLoadingTransactions}
          onSeeAll={() => router.push('/(app)/(tabs)/transactions' as never)}
        />
      </Screen>

      <WalletSelector
        wallets={allWallets}
        selectedId={selectedWalletId}
        onSelect={selectWallet}
        onClose={() => setWalletSelectorVisible(false)}
        visible={walletSelectorVisible}
      />
    </>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[16],
    gap: spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthSection: {
    alignItems: 'center',
  },
})
