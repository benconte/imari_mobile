/**
 * Vault detail screen — [id].tsx
 * Shows VaultProgress ring, stats grid, auto-save rules, contribution history,
 * and a fixed "Add Money" FAB at the bottom.
 * Confetti fires when contribution brings vault to 100%.
 */

import React, { useState, useRef } from 'react'
import { View, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../../src/hooks/useTheme'
import { useVault } from '../../../src/hooks/useSavings'
import { useWallet } from '../../../src/hooks/useWallet'
import { Text } from '../../../src/components/ui/Text'
import { Card } from '../../../src/components/ui/Card'
import { Badge } from '../../../src/components/ui/Badge'
import { Skeleton } from '../../../src/components/ui/Skeleton'
import { EmptyState } from '../../../src/components/ui/EmptyState'
import { Button } from '../../../src/components/ui/Button'
import { Switch } from '../../../src/components/ui/Switch'
import { ActionModal } from '../../../src/components/ui/ActionModal'
import { VaultProgress } from '../../../src/components/savings/VaultProgress'
import { VaultContributionSheet } from '../../../src/components/savings/VaultContributionSheet'
import { VaultWithdrawSheet } from '../../../src/components/savings/VaultWithdrawSheet'
import { formatCurrency } from '../../../src/lib/utils/currency'
import { spacing } from '../../../src/theme/spacing'
import { radius } from '../../../src/theme/radius'
import Svg, { Path } from 'react-native-svg'

const { width } = Dimensions.get('window')

// ─── Contribution item ───────────────────────────────────────────────────────
function ContributionItem({ amount, note, isAuto, date, currency }: {
  amount: number
  note: string | null
  isAuto: boolean
  date: string
  currency: string
}) {
  const { COLORS } = useTheme()
  const formatted = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <View style={styles.contributionRow}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
          <Text variant="body" style={{ color: COLORS.text.primary }}>{note ?? 'Contribution'}</Text>
          {isAuto && <Badge label="AUTO" variant="warning" size="sm" />}
        </View>
        <Text variant="caption" style={{ color: COLORS.text.tertiary, marginTop: 2 }}>{formatted}</Text>
      </View>
      <Text style={{ color: COLORS.status.success, fontFamily: 'DMMono_400Regular', fontSize: 15 }}>
        +{formatCurrency(amount, currency)}
      </Text>
    </View>
  )
}

// ─── VaultDetailScreen ───────────────────────────────────────────────────────
export default function VaultDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { COLORS } = useTheme()
  const { wallet } = useWallet()
  const { vault, contributions, rules, isLoading, contribute, isContributing, withdraw, isWithdrawing, refetch, closeVault } = useVault(id ?? '')

  const [sheetVisible, setSheetVisible] = useState(false)
  const [withdrawSheetVisible, setWithdrawSheetVisible] = useState(false)
  const [confettiVisible, setConfettiVisible] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [confirmCloseVisible, setConfirmCloseVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const availableBalance = wallet ? Number(wallet.availableBalance) : 0

  async function handleCloseVault() {
    setIsClosing(true)
    try {
      await closeVault()
      router.back()
    } catch {
      setIsClosing(false)
    }
  }

  function handleContributionSuccess(amount: number) {
    setSheetVisible(false)
    if (vault && vault.currentAmount + amount >= vault.targetAmount) {
      setConfettiVisible(true)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setTimeout(() => setConfettiVisible(false), 3500)
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
    Alert.alert('Success', `Successfully added ${formatCurrency(amount, vault?.currency || wallet?.currency || 'RWF')} to your vault.`)
    refetch()
  }

  function handleWithdrawSuccess(amount: number) {
    setWithdrawSheetVisible(false)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    Alert.alert('Success', `Successfully withdrew ${formatCurrency(amount, vault?.currency || wallet?.currency || 'RWF')} from your vault.`)
    refetch()
  }

  const daysLeft = vault?.targetDate
    ? Math.max(Math.ceil((new Date(vault.targetDate).getTime() - Date.now()) / 86_400_000), 0)
    : null

  const ruleDescriptions: Record<string, string> = {
    ROUND_UP: 'Round up transactions',
    FIXED_AMOUNT: `${formatCurrency(rules[0]?.amount ?? 0, vault?.currency ?? 'RWF')} monthly`,
    PERCENTAGE: `${rules[0]?.percentage ?? 0}% of each deposit`,
    SCHEDULED: 'Scheduled auto-save',
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: COLORS.background.primary }]}>
        <Skeleton width={160} height={160} radius={80} style={{ marginTop: spacing[8] }} />
        <Skeleton width={200} height={24} radius={radius.md} style={{ marginTop: spacing[4] }} />
        <Skeleton width={160} height={16} radius={radius.md} style={{ marginTop: spacing[2] }} />
      </View>
    )
  }

  if (!vault) return null

  return (
    <View style={[styles.screen, { backgroundColor: COLORS.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.background.primary }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M19 12H5M12 19l-7-7 7-7" stroke={COLORS.accent.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text variant="h3" style={{ color: COLORS.text.primary }} numberOfLines={1}>
          {vault.name}
        </Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            setMenuVisible(true)
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ color: COLORS.text.primary, fontSize: 22 }}>⋮</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* VaultProgress ring */}
        <View style={styles.progressCenter}>
          <VaultProgress
            current={vault.currentAmount}
            target={vault.targetAmount}
            currency={vault.currency}
            size={176}
            strokeWidth={14}
            emoji={vault.iconEmoji}
          />
        </View>

        {/* Stats grid */}
        <Card style={{ marginTop: spacing[4] }}>
          <View style={styles.statsGrid}>
            {[
              { label: 'Saved', value: formatCurrency(vault.currentAmount, vault.currency) },
              { label: 'Target', value: formatCurrency(vault.targetAmount, vault.currency) },
              { label: 'Remaining', value: formatCurrency(Math.max(vault.targetAmount - vault.currentAmount, 0), vault.currency) },
              { label: 'Days Left', value: daysLeft !== null ? String(daysLeft) : 'No deadline' },
            ].map(({ label, value }) => (
              <View key={label} style={styles.statCell}>
                <Text variant="caption" style={{ color: COLORS.text.secondary }}>{label}</Text>
                <Text
                  variant="body"
                  style={{ color: COLORS.text.primary, fontFamily: 'DMMono_400Regular', marginTop: 4 }}
                  numberOfLines={1}
                >
                  {value}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Auto-Save Rules */}
        {rules.length > 0 && (
          <View style={{ marginTop: spacing[4] }}>
            <Text variant="h3" style={{ color: COLORS.text.primary, marginBottom: spacing[3] }}>
              Auto-Save Rules
            </Text>
            <Card>
              {rules.map((rule, idx) => (
                <View key={rule.id}>
                  <Switch
                    value={rule.isActive}
                    onChange={() => { }}  // PATCH /savings/rules/:id/toggle
                    label={ruleDescriptions[rule.type] ?? rule.type}
                  />
                  {idx < rules.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: COLORS.border.subtle }]} />
                  )}
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Contribution History */}
        <View style={{ marginTop: spacing[4] }}>
          <Text variant="h3" style={{ color: COLORS.text.primary, marginBottom: spacing[3] }}>
            Contributions
          </Text>
          {contributions.length === 0 ? (
            <EmptyState
              icon={<Text style={{ fontSize: 40 }}>📥</Text>}
              title="No contributions yet"
              description="Add money to this vault to get started"
            />
          ) : (
            <Card>
              {contributions.map((c, idx) => (
                <View key={c.id}>
                  <ContributionItem
                    amount={c.amount}
                    note={c.note}
                    isAuto={c.isAuto}
                    date={c.createdAt}
                    currency={vault.currency}
                  />
                  {idx < contributions.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: COLORS.border.subtle }]} />
                  )}
                </View>
              ))}
            </Card>
          )}
        </View>

        <View style={{ height: spacing[16] }} />
      </ScrollView>

      {/* Add Money FAB */}
      {vault.status === 'ACTIVE' && (
        <View style={styles.fabContainer}>
          <Button
            variant="primary"
            fullWidth
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              setSheetVisible(true)
            }}
          >
            Add Money
          </Button>
        </View>
      )}

      {/* Contribution Sheet */}
      <VaultContributionSheet
        vault={vault}
        availableBalance={availableBalance}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSuccess={handleContributionSuccess}
        isContributing={isContributing}
        onContribute={async (amount, note) => { await contribute({ amount, note, currency: vault.currency || wallet?.currency || 'RWF' }) }}
      />

      {/* Withdraw Sheet */}
      <VaultWithdrawSheet
        vault={vault}
        availableBalance={availableBalance}
        visible={withdrawSheetVisible}
        onClose={() => setWithdrawSheetVisible(false)}
        onSuccess={handleWithdrawSuccess}
        isWithdrawing={isWithdrawing}
        onWithdraw={async (amount, note) => { await withdraw({ amount, note, currency: vault.currency || wallet?.currency || 'RWF' }) }}
      />

      {/* ⋮ Vault Options Modal */}
      <ActionModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title={vault.name}
        subtitle="Vault options"
        options={[
          {
            label: 'Withdraw',
            icon: '💸',
            description: 'Move funds back to your wallet',
            onPress: () => {
              setMenuVisible(false)
              setTimeout(() => {
                setWithdrawSheetVisible(true)
              }, 400)
            },
          },
          {
            label: 'Close Vault',
            icon: '🗑️',
            description: 'Cancel vault and return savings to wallet',
            destructive: true,
            onPress: () => setConfirmCloseVisible(true),
          },
        ]}
      />

      {/* Close Vault Confirmation */}
      <ActionModal
        visible={confirmCloseVisible}
        onClose={() => setConfirmCloseVisible(false)}
        title="Close Vault?"
        subtitle="Any saved amount will return to your wallet. This cannot be undone."
        options={[
          {
            label: isClosing ? 'Closing…' : 'Yes, Close Vault',
            icon: '⚠️',
            destructive: true,
            onPress: handleCloseVault,
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', paddingHorizontal: spacing[4] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
  },
  progressCenter: {
    alignItems: 'center',
    marginVertical: spacing[4],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCell: {
    width: '50%',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },
  divider: { height: 1, marginVertical: spacing[2] },
  contributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    gap: spacing[3],
  },
  fabContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
    paddingTop: spacing[3],
  },
})
