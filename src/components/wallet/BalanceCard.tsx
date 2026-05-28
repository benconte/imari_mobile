/**
 * BalanceCard — hero element of the home screen.
 * Always dark gradient regardless of color scheme.
 * Balance show/hide with Reanimated opacity fade.
 * Slides up on mount with withSpring.
 * Wallet number is always masked — shows only last 4 digits.
 *
 * PIN status is user-scoped — read from AuthContext.isPinSet, not per-wallet.
 */

import React, { useEffect, useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path } from 'react-native-svg'
import { Text } from '../ui/Text'
import { Skeleton } from '../ui/Skeleton'
import { PinUnlockSheet } from './PinUnlockSheet'
import { useAuth } from '../../hooks/useAuth'
import { formatCurrency, maskBalance } from '../../lib/utils/currency'
import { radius } from '../../theme/radius'
import { spacing } from '../../theme/spacing'

interface BalanceCardProps {
  balance: number
  currency: string
  walletNumber: string
  isLoading: boolean
  onHideBalance: () => void
  onRequestShowBalance: () => boolean
  onUnlockBalance: () => void
  isVisible: boolean
  onWalletPress: () => void    // → navigate to wallet management screen
  onSwitchWallet?: () => void  // → open wallet selector sheet
  walletCount?: number         // show switch icon only if > 1
}

const CARD_GRADIENT = ['#0F1729', '#1A2540', '#0F1729'] as const

/** Masks a wallet number, showing only the last 4 characters.
 *  "1234567890001234" → "•••• 1234"
 *  Already-short strings are shown as-is.
 */
function maskWalletNumber(raw: string): string {
  if (!raw) return '•••• ————'
  const clean = raw.replace(/\s/g, '')
  if (clean.length <= 4) return clean
  return `•••• ${clean.slice(-4)}`
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function EyeIcon({ visible }: { visible: boolean }) {
  const path = visible
    ? 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z'
    : 'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24 M1 1l22 22'
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d={path}
        stroke="rgba(255,255,255,0.7)"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function SwitchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function BalanceCard({
  balance,
  currency,
  walletNumber,
  isLoading,
  onHideBalance,
  onRequestShowBalance,
  onUnlockBalance,
  isVisible,
  onWalletPress,
  onSwitchWallet,
  walletCount = 1,
}: BalanceCardProps) {
  const { isPinSet } = useAuth()
  const [pinSheetVisible, setPinSheetVisible] = useState(false)

  const translateY = useSharedValue(20)
  const mountOpacity = useSharedValue(0)
  const balanceOpacity = useSharedValue(1)

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 16, stiffness: 120 })
    mountOpacity.value = withTiming(1, { duration: 400 })
  }, [mountOpacity, translateY])

  useEffect(() => {
    balanceOpacity.value = withTiming(0, { duration: 120 }, () => {
      balanceOpacity.value = withTiming(1, { duration: 200 })
    })
  }, [balanceOpacity, isVisible])

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: mountOpacity.value,
  }))
  const balanceStyle = useAnimatedStyle(() => ({ opacity: balanceOpacity.value }))

  function handleEyePress() {
    if (isVisible) {
      onHideBalance()
    } else {
      if (!isPinSet) {
        onUnlockBalance()
        return
      }
      const success = onRequestShowBalance()
      if (!success) {
        setPinSheetVisible(true)
      }
    }
  }

  return (
    <>
      <Animated.View style={[styles.container, containerStyle]}>
        <LinearGradient
          colors={CARD_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.glow} />

          {/* Top row */}
          <View style={styles.topRow}>
            <Text variant="label" style={styles.labelText}>Total Balance</Text>
            <View style={styles.topActions}>
              {onSwitchWallet && walletCount > 1 && (
                <TouchableOpacity
                  onPress={onSwitchWallet}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.switchBtn}
                  accessibilityLabel="Switch wallet"
                >
                  <SwitchIcon />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleEyePress}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={isVisible ? 'Hide balance' : 'Show balance'}
              >
                <EyeIcon visible={isVisible} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Balance */}
          {isLoading ? (
            <Skeleton width="70%" height={56} radius={8} style={styles.balanceSkeleton} />
          ) : (
            <Animated.View style={balanceStyle}>
              <Text variant="hero" style={styles.balanceText} numberOfLines={1}>
                {isVisible ? formatCurrency(balance, currency) : maskBalance()}
              </Text>
            </Animated.View>
          )}

          {/* Currency pill */}
          <View style={styles.currencyPill}>
            <Text variant="caption" style={styles.currencyText}>{currency}</Text>
          </View>

          {/* Bottom row — masked wallet number + manage link */}
          <TouchableOpacity
            style={styles.bottomRow}
            onPress={onWalletPress}
            activeOpacity={0.7}
            accessibilityLabel="Manage wallet"
          >
            {isLoading ? (
              <Skeleton width={120} height={16} radius={4} />
            ) : (
              <Text variant="bodySmall" style={styles.walletNumberText}>
                {maskWalletNumber(walletNumber)}
              </Text>
            )}
            <Text style={styles.manageText}>Manage →</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      <PinUnlockSheet
        visible={pinSheetVisible}
        onClose={() => setPinSheetVisible(false)}
        onSuccess={() => {
          setPinSheetVisible(false)
          onUnlockBalance()
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: { borderRadius: radius.xxl, overflow: 'hidden' },
  gradient: { padding: spacing[5], gap: spacing[2], minHeight: 180 },
  glow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(79, 142, 247, 0.12)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  switchBtn: {},
  labelText: { color: 'rgba(255,255,255,0.6)' },
  balanceSkeleton: { marginVertical: spacing[1] },
  balanceText: { color: '#FFFFFF', fontSize: 42, lineHeight: 52 },
  currencyPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  currencyText: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  walletNumberText: { color: 'rgba(255,255,255,0.6)' },
  manageText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
})
