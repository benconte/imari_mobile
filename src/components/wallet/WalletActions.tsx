/**
 * WalletActions — bottom sheet of contextual actions for a wallet.
 * Shows available actions based on wallet status and isPrimary flag.
 * Actions not yet supported by backend are shown as "Coming Soon".
 *
 * PIN actions (Set PIN / Change PIN) are intentionally NOT here.
 * They live in the wallet list header (⋮ menu) since PIN is user-scoped.
 */

import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Svg, { Path, Circle } from 'react-native-svg'
import { BottomSheet } from '../ui/BottomSheet'
import { Text } from '../ui/Text'
import { useTheme } from '../../hooks/useTheme'
import { spacing } from '../../theme/spacing'
import { radius } from '../../theme/radius'
import type { Wallet, WalletAction } from '../../types/wallet.types'

interface WalletActionsProps {
  wallet: Wallet | null
  visible: boolean
  onClose: () => void
  onAction: (walletId: string, action: WalletAction) => void
}

interface ActionRow {
  action: WalletAction
  label: string
  icon: React.ReactNode
  destructive?: boolean
  comingSoon?: boolean
  condition?: boolean
}

function PlusIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.8} />
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}
function StarIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
function LockIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
function SnowflakeIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07M12 5l-2-2M12 5l2-2M12 19l-2 2M12 19l2 2M5 12l-2-2M5 12l-2 2M19 12l2-2M19 12l2 2"
        stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  )
}
function KeyIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function WalletActions({ wallet, visible, onClose, onAction }: WalletActionsProps) {
  const { COLORS } = useTheme()

  if (!wallet) return null

  const actions: ActionRow[] = [
    {
      action: 'FUND',
      label: 'Fund Wallet',
      icon: <PlusIcon color={COLORS.accent.primary} />,
    },
    {
      action: 'SET_PRIMARY',
      label: 'Set as Primary',
      icon: <StarIcon color={COLORS.accent.primary} />,
      condition: !wallet.isPrimary && wallet.status === 'ACTIVE',
    },
    {
      action: 'FREEZE',
      label: 'Freeze Wallet',
      icon: <SnowflakeIcon color={COLORS.text.tertiary} />,
      condition: wallet.status === 'ACTIVE',
      comingSoon: true,
    },
    {
      action: 'UNFREEZE',
      label: 'Unfreeze Wallet',
      icon: <SnowflakeIcon color={COLORS.text.tertiary} />,
      condition: wallet.status === 'FROZEN',
      comingSoon: true,
    },
    {
      action: 'RENAME',
      label: 'Rename Wallet',
      icon: <KeyIcon color={COLORS.text.tertiary} />,
      comingSoon: true,
    },
    {
      action: 'CLOSE',
      label: 'Close Wallet',
      icon: <LockIcon color={COLORS.status.error} />,
      destructive: true,
      condition: !wallet.isPrimary && wallet.status !== 'CLOSED',
      comingSoon: true,
    },
  ]

  const visibleActions = actions.filter((a) => a.condition === undefined || a.condition)

  function handleAction(action: WalletAction, comingSoon?: boolean) {
    if (comingSoon) return
    onClose()
    onAction(wallet!.id, action)
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Wallet Actions" snapPoints={[390]}>
      <View style={styles.list}>
        {visibleActions.map((row) => (
          <Pressable
            key={row.action}
            style={({ pressed }) => [
              styles.row,
              { opacity: pressed && !row.comingSoon ? 0.7 : 1 },
            ]}
            onPress={() => handleAction(row.action, row.comingSoon)}
            accessibilityLabel={row.label}
          >
            <View style={[styles.iconWrap, { backgroundColor: COLORS.background.tertiary }]}>
              {row.icon}
            </View>
            <Text
              variant="body"
              style={[
                styles.label,
                { color: row.destructive ? COLORS.status.error : row.comingSoon ? COLORS.text.tertiary : COLORS.text.primary },
              ]}
            >
              {row.label}
            </Text>
            {row.comingSoon && (
              <View style={[styles.soonBadge, { backgroundColor: COLORS.background.tertiary }]}>
                <Text variant="caption" style={{ color: COLORS.text.tertiary, fontSize: 10 }}>
                  Soon
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing[4],
    gap: spacing[1],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1 },
  soonBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radius.full,
  },
})
