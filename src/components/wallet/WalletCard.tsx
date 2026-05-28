/**
 * WalletCard — management-focused card for the wallet list screen.
 * Always dark gradient background regardless of app color scheme.
 * Shows status badge, balance, masked wallet number, primary badge.
 */

import React from 'react'
import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path } from 'react-native-svg'
import { Text } from '../ui/Text'
import { Badge } from '../ui/Badge'
import { Skeleton } from '../ui/Skeleton'
import { formatCurrency } from '../../lib/utils/currency'
import { radius } from '../../theme/radius'
import { spacing } from '../../theme/spacing'
import type { Wallet } from '../../types/wallet.types'

const CARD_GRADIENT = ['#15171C', '#22262E', '#0B0C0F'] as const
const PREMIUM_BORDER = 'rgba(255, 255, 255, 0.08)'

const CURRENCY_FLAGS: Record<string, string> = {
  RWF: '🇷🇼', USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', KES: '🇰🇪',
  UGX: '🇺🇬', TZS: '🇹🇿',
}

interface WalletCardProps {
  wallet: Wallet
  onPress: (id: string) => void
  onMorePress: (id: string) => void
  isSelected?: boolean
}

function MoreIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 21a1 1 0 110-2 1 1 0 010 2z"
        fill="rgba(255,255,255,0.6)" />
    </Svg>
  )
}

function maskWalletNumber(num: string) {
  if (num.length <= 4) return num
  return `**** ${num.slice(-4)}`
}

export function WalletCard({ wallet, onPress, onMorePress, isSelected = false }: WalletCardProps) {
  const flag = CURRENCY_FLAGS[wallet.currency] ?? '💳'

  const statusBadge = () => {
    switch (wallet.status) {
      case 'ACTIVE': return <Badge label="Active" variant="success" size="sm" />
      case 'FROZEN': return <Badge label="Frozen" variant="info" size="sm" />
      case 'CLOSED': return <Badge label="Closed" variant="neutral" size="sm" />
    }
  }

  return (
    <Pressable
      onPress={() => onPress(wallet.id)}
      style={[styles.wrapper, isSelected && styles.wrapperSelected]}
      accessibilityLabel={`${wallet.currency} wallet`}
    >
      <LinearGradient colors={CARD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        {/* Frozen overlay */}
        {wallet.status === 'FROZEN' && <View style={styles.frozenOverlay} />}

        {/* Top row */}
        <View style={styles.topRow}>
          <View style={styles.flagRow}>
            <Text style={styles.flag}>{flag}</Text>
            <View>
              <Text style={styles.currencyLabel}>{wallet.currency}</Text>
              <Text style={styles.walletName}>{wallet.name || 'Main Wallet'}</Text>
            </View>
          </View>
          <View style={styles.topRight}>
            {statusBadge()}
            {!wallet.isPrimary && (
              <TouchableOpacity
                onPress={() => onMorePress(wallet.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.moreBtn}
                accessibilityLabel="Wallet actions"
              >
                <MoreIcon />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Middle/Balance */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceCurrency}>{wallet.currency}</Text>
          <Text style={styles.balance}>
            {formatCurrency(wallet.balance, wallet.currency).replace(wallet.currency, '').trim()}
          </Text>
        </View>

        {/* Bottom row */}
        <View style={styles.bottomRow}>
          <Text style={styles.walletNum}>{maskWalletNumber(wallet.walletNumber)}</Text>
          {wallet.isPrimary && <Badge label="Primary" variant="gold" size="sm" />}
        </View>
      </LinearGradient>
    </Pressable>
  )
}

export function WalletCardSkeleton() {
  return (
    <View style={styles.wrapper}>
      <Skeleton width="100%" height={140} radius={radius.xl} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: PREMIUM_BORDER,
  },
  wrapperSelected: {
    borderColor: '#D4AF37', // Gold border for selected
    borderWidth: 1.5,
  },
  card: {
    padding: spacing[6],
    minHeight: 180,
    justifyContent: 'space-between',
  },
  frozenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  flag: { fontSize: 24 },
  currencyLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.5,
  },
  walletName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    marginTop: 2,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  moreBtn: { 
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.full,
  },
  balanceContainer: {
    marginTop: spacing[4],
    marginBottom: spacing[4],
  },
  balanceCurrency: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontFamily: 'DMMono_400Regular',
    marginBottom: 4,
  },
  balance: {
    color: '#FFFFFF',
    fontSize: 34,
    fontFamily: 'DMMono_400Regular',
    lineHeight: 40,
    letterSpacing: -1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  walletNum: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontFamily: 'DMMono_400Regular',
    letterSpacing: 2,
  },
})
