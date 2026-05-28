/**
 * Savings screen — vault list + total saved header.
 * Session 5: full implementation replacing the Session 1 skeleton.
 */

import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Screen } from '../../../src/components/layout/Screen'
import { Text } from '../../../src/components/ui/Text'
import { Card } from '../../../src/components/ui/Card'
import { Skeleton } from '../../../src/components/ui/Skeleton'
import { EmptyState } from '../../../src/components/ui/EmptyState'
import { Badge } from '../../../src/components/ui/Badge'
import { VaultCard } from '../../../src/components/savings/VaultCard'
import { useSavings } from '../../../src/hooks/useSavings'
import { useWallet } from '../../../src/hooks/useWallet'
import { useTheme } from '../../../src/hooks/useTheme'
import { formatCurrency } from '../../../src/lib/utils/currency'
import { spacing } from '../../../src/theme/spacing'
import { radius } from '../../../src/theme/radius'
import Svg, { Path } from 'react-native-svg'

// ─── FAB icon ───────────────────────────────────────────────────────────────
function PlusIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  )
}

// ─── TotalSavedCard ──────────────────────────────────────────────────────────
function TotalSavedCard({
  totalSaved,
  currency,
  activeCount,
  isLoading,
}: {
  totalSaved: number
  currency: string
  activeCount: number
  isLoading: boolean
}) {
  const { COLORS } = useTheme()

  if (isLoading) {
    return <Skeleton width="100%" height={88} radius={radius.xl} />
  }

  return (
    <Card>
      <View style={styles.totalRow}>
        <View>
          <Text variant="label" style={{ color: COLORS.text.secondary }}>Total Saved</Text>
          <Text
            variant="h2"
            style={{ color: COLORS.text.primary, fontFamily: 'DMMono_400Regular', marginTop: 4 }}
          >
            {formatCurrency(totalSaved, currency)}
          </Text>
        </View>
        <View style={styles.vaultCount}>
          <Text
            variant="hero"
            style={{ color: COLORS.accent.primary, fontFamily: 'DMMono_400Regular', fontSize: 36 }}
          >
            {activeCount}
          </Text>
          <Text variant="caption" style={{ color: COLORS.text.secondary }}>
            {activeCount === 1 ? 'Vault' : 'Vaults'}
          </Text>
        </View>
      </View>
    </Card>
  )
}

// ─── SavingsScreen ──────────────────────────────────────────────────────────
export default function SavingsScreen() {
  const { COLORS } = useTheme()
  const router = useRouter()
  const { vaults, totalSaved, isLoading, refetch } = useSavings()
  const { wallet } = useWallet()
  const insets = useSafeAreaInsets()

  const activeVaults = vaults.filter((v) => v.status !== 'CANCELLED')
  const currency = wallet?.currency ?? 'RWF'

  function handleCreateVault() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/(app)/savings/create' as never)
  }

  return (
    <>
      <Screen
        scrollable
        refreshing={isLoading}
        onRefresh={refetch}
        edges={['top', 'left', 'right']}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 180 }
        ]}
      >
        {/* Header */}
        <Text variant="h1" style={{ color: COLORS.text.primary }}>Savings</Text>

        {/* Total Saved Card */}
        <TotalSavedCard
          totalSaved={totalSaved}
          currency={currency}
          activeCount={activeVaults.length}
          isLoading={isLoading}
        />

        {/* Vault List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="h3" style={{ color: COLORS.text.primary }}>Your Vaults</Text>
            {!isLoading && activeVaults.length > 0 && (
              <Badge label={String(activeVaults.length)} variant="info" size="sm" />
            )}
          </View>

          {isLoading ? (
            <>
              <Skeleton width="100%" height={136} radius={radius.xl} />
              <Skeleton width="100%" height={136} radius={radius.xl} style={{ marginTop: spacing[3] }} />
            </>
          ) : activeVaults.length === 0 ? (
            <EmptyState
              icon={<Text style={{ fontSize: 48 }}>🏦</Text>}
              title="No vaults yet"
              description="Create a vault to start saving towards a goal"
              action={{ label: 'Create Vault', onPress: handleCreateVault }}
            />
          ) : (
            <View style={{ gap: spacing[3] }}>
              {activeVaults.map((vault) => (
                <VaultCard
                  key={vault.id}
                  vault={vault}
                  onPress={(id) => router.push(`/(app)/savings/${id}` as never)}
                />
              ))}
            </View>
          )}
        </View>
      </Screen>

      {/* FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: COLORS.accent.primary,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 24,
            elevation: 14,
            bottom: insets.bottom + 104,
          },
        ]}
        onPress={handleCreateVault}
        accessibilityLabel="Create new vault"
      >
        <PlusIcon />
      </TouchableOpacity>
    </>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    gap: spacing[4],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vaultCount: {
    alignItems: 'center',
  },
  section: {
    gap: spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  fab: {
    position: 'absolute',
    right: spacing[4],
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
