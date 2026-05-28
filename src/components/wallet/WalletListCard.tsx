/**
 * WalletListCard — per-wallet card for the My Wallets index screen.
 *
 * Design goals:
 *   - Balance hidden by default; tap eye to reveal (same PIN flow as BalanceCard)
 *   - Wallet number masked to last 4 digits
 *   - "Primary" badge when wallet.isPrimary === true
 *   - Light/dark aware via useSystemColorScheme
 *   - Each currency gets a distinct tonal theme (same palette system as VaultCard)
 *   - Tap the card body → onPress (navigate to detail)
 *   - Tap ⋯ → onMorePress (open WalletActions sheet)
 */

import React, { useEffect, useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Path, Rect, Circle } from 'react-native-svg'
import * as Haptics from 'expo-haptics'
import { useColorScheme as useSystemColorScheme } from 'react-native'
import { Text } from '../ui/Text'
import { Skeleton } from '../ui/Skeleton'
import { PinUnlockSheet } from './PinUnlockSheet'
import { useAuth } from '../../hooks/useAuth'
import { formatCurrency, maskBalance } from '../../lib/utils/currency'
import { spacing } from '../../theme/spacing'
import type { Wallet } from '../../types/wallet.types'

// ─── Wallet number masking ────────────────────────────────────────────────────

function maskWalletNumber(raw: string): string {
  if (!raw) return '•••• ————'
  const clean = raw.replace(/\s/g, '')
  if (clean.length <= 4) return clean
  return `•••• ${clean.slice(-4)}`
}

// ─── Theme system ─────────────────────────────────────────────────────────────

type Scheme = 'light' | 'dark'

interface CardTheme {
  card: string
  cardBorder: string
  labelText: string
  balanceText: string
  walletNumText: string
  pillBg: string
  pillText: string
  primaryBg: string
  primaryText: string
  divider: string
  accentDot: string
  moreBtnBg: string
  moreIconColor: string
  eyeColor: string
  detailLinkColor: string
}

// Dark mode strategy: all cards share the same elevated neutral surface so they
// visually lift off the page background. Color identity comes purely from the
// accent (dot, pill text, balance value, "View →") — not the card background.
// This avoids the muddy tinted-dark-surface problem in the screenshot.

const DARK_SURFACE = '#1C1E26'       // elevated card bg — clearly above system bg
const DARK_BORDER = 'rgba(255,255,255,0.09)'
const DARK_DIVIDER = 'rgba(255,255,255,0.07)'
const DARK_MORE_BG = 'rgba(255,255,255,0.07)'
const DARK_BALANCE = '#F0F0F6'       // near-white balance text
const DARK_WALLET_NUM = 'rgba(255,255,255,0.30)'

const PALETTE: Record<string, Record<Scheme, CardTheme>> = {
  // RWF — warm amber/gold accent
  rwf: {
    light: {
      card: '#F7F2EA',
      cardBorder: '#EAE0CE',
      labelText: '#9A7838',
      balanceText: '#2A200E',
      walletNumText: '#B89050',
      pillBg: 'rgba(120,90,40,0.10)',
      pillText: '#7A5A28',
      primaryBg: 'rgba(196,154,60,0.15)',
      primaryText: '#8A6020',
      divider: 'rgba(120,90,40,0.15)',
      accentDot: '#C49A3C',
      moreBtnBg: 'rgba(120,90,40,0.08)',
      moreIconColor: '#9A7838',
      eyeColor: '#9A7838',
      detailLinkColor: '#C49A3C',
    },
    dark: {
      card: DARK_SURFACE,
      cardBorder: DARK_BORDER,
      labelText: 'rgba(255,255,255,0.40)',
      balanceText: DARK_BALANCE,
      walletNumText: DARK_WALLET_NUM,
      pillBg: 'rgba(212,168,76,0.15)',
      pillText: '#E8B84A',
      primaryBg: 'rgba(212,168,76,0.15)',
      primaryText: '#E8B84A',
      divider: DARK_DIVIDER,
      accentDot: '#E8B84A',
      moreBtnBg: DARK_MORE_BG,
      moreIconColor: 'rgba(255,255,255,0.45)',
      eyeColor: 'rgba(255,255,255,0.45)',
      detailLinkColor: '#E8B84A',
    },
  },
  // USD / EUR — electric blue accent
  usd: {
    light: {
      card: '#EDF0F7',
      cardBorder: '#D8DEEE',
      labelText: '#4A62A0',
      balanceText: '#141926',
      walletNumText: '#6070A8',
      pillBg: 'rgba(60,80,160,0.09)',
      pillText: '#3C5090',
      primaryBg: 'rgba(60,108,204,0.12)',
      primaryText: '#2A4A90',
      divider: 'rgba(60,80,160,0.12)',
      accentDot: '#3C6CCC',
      moreBtnBg: 'rgba(60,80,160,0.07)',
      moreIconColor: '#5068A8',
      eyeColor: '#5068A8',
      detailLinkColor: '#3C6CCC',
    },
    dark: {
      card: DARK_SURFACE,
      cardBorder: DARK_BORDER,
      labelText: 'rgba(255,255,255,0.40)',
      balanceText: DARK_BALANCE,
      walletNumText: DARK_WALLET_NUM,
      pillBg: 'rgba(106,154,224,0.15)',
      pillText: '#7EB4F0',
      primaryBg: 'rgba(106,154,224,0.15)',
      primaryText: '#7EB4F0',
      divider: DARK_DIVIDER,
      accentDot: '#7EB4F0',
      moreBtnBg: DARK_MORE_BG,
      moreIconColor: 'rgba(255,255,255,0.45)',
      eyeColor: 'rgba(255,255,255,0.45)',
      detailLinkColor: '#7EB4F0',
    },
  },
  // GBP — fresh green accent
  gbp: {
    light: {
      card: '#EAF0EA',
      cardBorder: '#D0DDD0',
      labelText: '#386848',
      balanceText: '#0E1F12',
      walletNumText: '#507858',
      pillBg: 'rgba(40,100,60,0.09)',
      pillText: '#286440',
      primaryBg: 'rgba(40,138,80,0.12)',
      primaryText: '#1A6030',
      divider: 'rgba(40,100,60,0.12)',
      accentDot: '#288A50',
      moreBtnBg: 'rgba(40,100,60,0.07)',
      moreIconColor: '#3A7848',
      eyeColor: '#3A7848',
      detailLinkColor: '#288A50',
    },
    dark: {
      card: DARK_SURFACE,
      cardBorder: DARK_BORDER,
      labelText: 'rgba(255,255,255,0.40)',
      balanceText: DARK_BALANCE,
      walletNumText: DARK_WALLET_NUM,
      pillBg: 'rgba(80,210,120,0.13)',
      pillText: '#5ED890',
      primaryBg: 'rgba(80,210,120,0.13)',
      primaryText: '#5ED890',
      divider: DARK_DIVIDER,
      accentDot: '#5ED890',
      moreBtnBg: DARK_MORE_BG,
      moreIconColor: 'rgba(255,255,255,0.45)',
      eyeColor: 'rgba(255,255,255,0.45)',
      detailLinkColor: '#5ED890',
    },
  },
  // fallback — soft lavender accent
  default: {
    light: {
      card: '#F0F0F2',
      cardBorder: '#E0E0E4',
      labelText: '#606068',
      balanceText: '#18181C',
      walletNumText: '#808088',
      pillBg: 'rgba(80,80,100,0.09)',
      pillText: '#505060',
      primaryBg: 'rgba(80,80,100,0.12)',
      primaryText: '#404050',
      divider: 'rgba(80,80,100,0.12)',
      accentDot: '#7070A0',
      moreBtnBg: 'rgba(80,80,100,0.07)',
      moreIconColor: '#606070',
      eyeColor: '#606070',
      detailLinkColor: '#7070A0',
    },
    dark: {
      card: DARK_SURFACE,
      cardBorder: DARK_BORDER,
      labelText: 'rgba(255,255,255,0.40)',
      balanceText: DARK_BALANCE,
      walletNumText: DARK_WALLET_NUM,
      pillBg: 'rgba(180,170,255,0.12)',
      pillText: '#C0B8FF',
      primaryBg: 'rgba(180,170,255,0.12)',
      primaryText: '#C0B8FF',
      divider: DARK_DIVIDER,
      accentDot: '#C0B8FF',
      moreBtnBg: DARK_MORE_BG,
      moreIconColor: 'rgba(255,255,255,0.45)',
      eyeColor: 'rgba(255,255,255,0.45)',
      detailLinkColor: '#C0B8FF',
    },
  },
}

const CURRENCY_PALETTE_MAP: Record<string, string> = {
  RWF: 'rwf',
  USD: 'usd',
  EUR: 'usd',  // share slate-blue
  GBP: 'gbp',
}

function getTheme(currency: string, scheme: Scheme): CardTheme {
  const key = CURRENCY_PALETTE_MAP[currency?.toUpperCase()] ?? 'default'
  return PALETTE[key][scheme]
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function EyeIcon({ visible, color }: { visible: boolean; color: string }) {
  const path = visible
    ? 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z'
    : 'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24 M1 1l22 22'
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d={path}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function DotsIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="1.5" fill={color} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="19" r="1.5" fill={color} />
    </Svg>
  )
}

function LockIcon({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth={2} />
      <Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

function ArrowIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function WalletListCardSkeleton() {
  return <Skeleton width="100%" height={148} radius={20} />
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface WalletListCardProps {
  wallet: Wallet
  onPress: (id: string) => void
  onMorePress: (id: string) => void
  /** Shared balance-visibility state from useWallet */
  isBalanceVisible: boolean
  onHideBalance: () => void
  onRequestShowBalance: () => boolean
  onUnlockBalance: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WalletListCard({
  wallet,
  onPress,
  onMorePress,
  isBalanceVisible,
  onHideBalance,
  onRequestShowBalance,
  onUnlockBalance,
}: WalletListCardProps) {
  const systemScheme = useSystemColorScheme() ?? 'light'
  const { isPinSet } = useAuth()
  const [pinSheetVisible, setPinSheetVisible] = useState(false)

  const theme = getTheme(wallet.currency, systemScheme)

  // Mount animation
  const translateY = useSharedValue(12)
  const opacity = useSharedValue(0)
  useEffect(() => {
    translateY.value = withSpring(0, { damping: 18, stiffness: 130 })
    opacity.value = withTiming(1, { duration: 320 })
  }, [opacity, translateY])

  // Balance fade on visibility change
  const balanceOpacity = useSharedValue(1)
  useEffect(() => {
    balanceOpacity.value = withTiming(0, { duration: 100 }, () => {
      balanceOpacity.value = withTiming(1, { duration: 180 })
    })
  }, [balanceOpacity, isBalanceVisible])

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))
  const balanceStyle = useAnimatedStyle(() => ({ opacity: balanceOpacity.value }))

  function handleEyePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (isBalanceVisible) {
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

  function handleCardPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress(wallet.id)
  }

  function handleMorePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onMorePress(wallet.id)
  }

  return (
    <>
      <Animated.View style={containerStyle}>
        <TouchableOpacity
          onPress={handleCardPress}
          activeOpacity={0.88}
          accessibilityLabel={`${wallet.currency} wallet, ${maskWalletNumber(wallet.walletNumber)}`}
        >
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>

            {/* ── Top row: currency badge + eye + more ── */}
            <View style={styles.topRow}>
              <View style={styles.topLeft}>
                {/* Currency pill */}
                <View style={[styles.currencyPill, { backgroundColor: theme.pillBg }]}>
                  <View style={[styles.accentDot, { backgroundColor: theme.accentDot }]} />
                  <Text style={[styles.currencyText, { color: theme.pillText }]}>
                    {wallet.currency}
                  </Text>
                </View>

                {/* Primary badge */}
                {wallet.isPrimary && (
                  <View style={[styles.primaryBadge, { backgroundColor: theme.primaryBg }]}>
                    <Text style={[styles.primaryText, { color: theme.primaryText }]}>
                      Primary
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.topRight}>
                {/* Eye toggle */}
                <TouchableOpacity
                  onPress={handleEyePress}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={isBalanceVisible ? 'Hide balance' : 'Show balance'}
                >
                  <EyeIcon visible={isBalanceVisible} color={theme.eyeColor} />
                </TouchableOpacity>

                {/* More (⋯) */}
                <TouchableOpacity
                  onPress={handleMorePress}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[styles.moreBtn, { backgroundColor: theme.moreBtnBg }]}
                  accessibilityLabel="Wallet options"
                >
                  <DotsIcon color={theme.moreIconColor} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Divider ── */}
            <View style={[styles.divider, { backgroundColor: theme.divider }]} />

            {/* ── Balance row ── */}
            <View style={styles.balanceRow}>
              <View style={styles.balanceBlock}>
                <Text style={[styles.balanceLabel, { color: theme.labelText }]}>BALANCE</Text>
                <Animated.View style={balanceStyle}>
                  <Text style={[styles.balanceValue, { color: theme.balanceText }]} numberOfLines={1}>
                    {isBalanceVisible
                      ? formatCurrency(Number(wallet.balance), wallet.currency)
                      : maskBalance()}
                  </Text>
                </Animated.View>
              </View>

              {/* View detail link */}
              <View style={styles.detailLink}>
                <Text style={[styles.detailText, { color: theme.detailLinkColor }]}>View</Text>
                <ArrowIcon color={theme.detailLinkColor} />
              </View>
            </View>

            {/* ── Wallet number ── */}
            <View style={styles.walletNumRow}>
              <LockIcon color={theme.walletNumText} />
              <Text style={[styles.walletNumText, { color: theme.walletNumText }]}>
                {maskWalletNumber(wallet.walletNumber)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 0.5,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
  },
  currencyText: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  primaryBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 99,
  },
  primaryText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    letterSpacing: 0.2,
  },
  moreBtn: {
    width: 30,
    height: 30,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 0.5,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  balanceBlock: {
    gap: 3,
    flex: 1,
  },
  balanceLabel: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 10,
    letterSpacing: 1.2,
  },
  balanceValue: {
    fontFamily: 'Syne_700Bold',
    fontSize: 26,
    letterSpacing: -0.8,
    lineHeight: 30,
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 2,
  },
  detailText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
  },
  walletNumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletNumText: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 12,
    letterSpacing: 1,
  },
})
