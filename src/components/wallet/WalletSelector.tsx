/**
 * WalletSelector — bottom sheet for switching between wallets.
 * Shows all wallets, selected state, and "Add wallet" option.
 */

import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { BottomSheet } from '../ui/BottomSheet'
import { Text } from '../ui/Text'
import { useTheme } from '../../hooks/useTheme'
import { formatCurrency, truncateWalletNumber } from '../../lib/utils/currency'
import { spacing } from '../../theme/spacing'
import { radius } from '../../theme/radius'
import type { Wallet } from '../../types/wallet.types'

interface WalletSelectorProps {
  wallets: Wallet[]
  selectedId: string
  onSelect: (walletId: string) => void
  onClose: () => void
  visible: boolean
  onManage?: () => void
  onAddWallet?: () => void
}

export function WalletSelector({
  wallets,
  selectedId,
  onSelect,
  onClose,
  visible,
  onManage,
  onAddWallet,
}: WalletSelectorProps) {
  const { COLORS } = useTheme()

  const sheetHeight = Math.min(120 + wallets.length * 64 + 100, 480)

  function handleSelect(id: string) {
    onSelect(id)
    onClose()
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Select Wallet"
      snapPoints={[sheetHeight]}
    >
      <View style={styles.list}>
        {wallets.map((wallet) => {
          const isSelected = wallet.id === selectedId
          return (
            <TouchableOpacity
              key={wallet.id}
              style={[
                styles.walletRow,
                isSelected && { backgroundColor: COLORS.accent.primaryMuted },
              ]}
              onPress={() => handleSelect(wallet.id)}
              activeOpacity={0.7}
            >
              {/* Currency icon */}
              <View style={[styles.currencyBadge, { backgroundColor: COLORS.background.tertiary }]}>
                <Text variant="label" style={{ color: COLORS.accent.primary }}>
                  {wallet.currency.slice(0, 2)}
                </Text>
              </View>

              {/* Wallet info */}
              <View style={styles.walletInfo}>
                <Text variant="body" style={{ color: COLORS.text.primary }}>
                  {truncateWalletNumber(wallet.walletNumber)}
                </Text>
                <Text variant="caption" style={{ color: COLORS.text.secondary }}>
                  {formatCurrency(wallet.balance, wallet.currency)}
                </Text>
              </View>

              {/* Selected indicator */}
              {isSelected && (
                <View style={[styles.checkCircle, { backgroundColor: COLORS.accent.primary }]}>
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M20 6L9 17l-5-5"
                      stroke="#fff"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              )}
            </TouchableOpacity>
          )
        })}

        {/* Add wallet */}
        <TouchableOpacity
          style={styles.addRow}
          activeOpacity={0.7}
          onPress={() => { onClose(); onAddWallet?.() }}
          accessibilityLabel="Add wallet"
        >
          <View style={[styles.addIcon, { backgroundColor: COLORS.background.tertiary }]}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 5v14M5 12h14"
                stroke={COLORS.accent.primary}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </View>
          <Text variant="body" style={{ color: COLORS.accent.primary }}>
            Add wallet
          </Text>
        </TouchableOpacity>

        {/* Manage all wallets link */}
        <TouchableOpacity
          style={[styles.manageLink, { borderTopColor: COLORS.border.subtle }]}
          activeOpacity={0.7}
          onPress={() => { onClose(); onManage?.() }}
          accessibilityLabel="Manage all wallets"
        >
          <Text variant="caption" style={{ color: COLORS.text.secondary }}>
            Manage all wallets →
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing[4],
    gap: spacing[1],
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: radius.lg,
    gap: spacing[3],
  },
  currencyBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletInfo: {
    flex: 1,
    gap: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: radius.lg,
    gap: spacing[3],
    marginTop: spacing[1],
  },
  addIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageLink: {
    alignItems: 'center',
    paddingVertical: spacing[3],
    marginTop: spacing[1],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
})
