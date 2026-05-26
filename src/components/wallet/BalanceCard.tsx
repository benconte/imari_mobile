/**
 * BalanceCard — hero element of the home screen.
 * Always dark gradient regardless of color scheme.
 * Balance show/hide with Reanimated opacity fade.
 * Slides up on mount with withSpring.
 */

import React, { useEffect } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path } from 'react-native-svg'
import { Text } from '../ui/Text'
import { Skeleton } from '../ui/Skeleton'
import { formatCurrency, maskBalance, truncateWalletNumber } from '../../lib/utils/currency'
import { radius } from '../../theme/radius'
import { spacing } from '../../theme/spacing'

interface BalanceCardProps {
  balance: number
  currency: string
  walletNumber: string
  isLoading: boolean
  onToggleVisibility: () => void
  isVisible: boolean
  onWalletPress: () => void
}

const CARD_GRADIENT = ['#0F1729', '#1A2540', '#0F1729'] as const

// ─── Icons ────────────────────────────────────────────────────────────────────
function EyeIcon({ visible }: { visible: boolean }) {
  const path = visible
    ? 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z'
    : 'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24 M1 1l22 22'
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d={path} stroke="rgba(255,255,255,0.7)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function ChevronIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke="rgba(255,255,255,0.5)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

// ─── BalanceCard ──────────────────────────────────────────────────────────────
export function BalanceCard({ balance, currency, walletNumber, isLoading, onToggleVisibility, isVisible, onWalletPress }: BalanceCardProps) {
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

  const containerStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }], opacity: mountOpacity.value }))
  const balanceStyle = useAnimatedStyle(() => ({ opacity: balanceOpacity.value }))

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <LinearGradient colors={CARD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
        <View style={styles.glow} />
        <View style={styles.topRow}>
          <Text variant="label" style={styles.labelText}>Total Balance</Text>
          <TouchableOpacity onPress={onToggleVisibility} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <EyeIcon visible={isVisible} />
          </TouchableOpacity>
        </View>
        {isLoading ? (
          <Skeleton width="70%" height={56} radius={8} style={styles.balanceSkeleton} />
        ) : (
          <Animated.View style={balanceStyle}>
            <Text variant="hero" style={styles.balanceText} numberOfLines={1}>
              {isVisible ? formatCurrency(balance, currency) : maskBalance()}
            </Text>
          </Animated.View>
        )}
        <View style={styles.currencyPill}>
          <Text variant="caption" style={styles.currencyText}>{currency}</Text>
        </View>
        <TouchableOpacity style={styles.bottomRow} onPress={onWalletPress} activeOpacity={0.7}>
          {isLoading ? <Skeleton width={120} height={16} radius={4} /> : (
            <Text variant="bodySmall" style={styles.walletNumberText}>{truncateWalletNumber(walletNumber)}</Text>
          )}
          <ChevronIcon />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { borderRadius: radius.xxl, overflow: 'hidden' },
  gradient: { padding: spacing[5], gap: spacing[2], minHeight: 180 },
  glow: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(79, 142, 247, 0.12)' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  labelText: { color: 'rgba(255,255,255,0.6)' },
  balanceSkeleton: { marginVertical: spacing[1] },
  balanceText: { color: '#FFFFFF', fontSize: 42, lineHeight: 52 },
  currencyPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: radius.full },
  currencyText: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing[2] },
  walletNumberText: { color: 'rgba(255,255,255,0.6)' },
})
