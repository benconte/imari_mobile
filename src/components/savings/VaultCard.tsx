/**
 * VaultCard — card displayed in the savings vault list.
 * Background gradient varies by emoji category.
 * Shows lock overlay for locked vaults.
 * Haptic on press.
 */

import React from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Rect } from 'react-native-svg'
import * as Haptics from 'expo-haptics'
import { Text } from '../ui/Text'
import { Skeleton } from '../ui/Skeleton'
import { ProgressBar } from '../ui/ProgressBar'
import { formatCurrency } from '../../lib/utils/currency'
import { radius } from '../../theme/radius'
import { spacing } from '../../theme/spacing'
import type { SavingsVault } from '../../types/savings.types'

// Emoji → gradient mapping per roadmap spec
const EMOJI_GRADIENTS: { emojis: string[]; colors: [string, string] }[] = [
  { emojis: ['🏠', '🏡'], colors: ['#1A2540', '#1E2D4A'] },
  { emojis: ['✈️', '🌍', '🌎', '🌏'], colors: ['#1A2535', '#1E3040'] },
  { emojis: ['💻', '📱', '🎮', '📺'], colors: ['#1F1A35', '#281E45'] },
  { emojis: ['🎓', '📚', '📖', '🏫'], colors: ['#1A2520', '#1E3028'] },
  { emojis: ['💍', '💒', '👰', '🤵'], colors: ['#2A1A20', '#351E25'] },
  { emojis: ['🚗', '🏎️', '🛻', '🚙'], colors: ['#201A25', '#2A1E35'] },
]
const DEFAULT_GRADIENT: [string, string] = ['#1A1F2E', '#1E2535']

function getGradient(emoji: string | null): [string, string] {
  if (!emoji) return DEFAULT_GRADIENT
  for (const { emojis, colors } of EMOJI_GRADIENTS) {
    if (emojis.some((e) => emoji.includes(e))) return colors
  }
  return DEFAULT_GRADIENT
}

function LockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="rgba(255,255,255,0.8)" strokeWidth={1.8} />
      <Path d="M7 11V7a5 5 0 0110 0v4" stroke="rgba(255,255,255,0.8)" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

interface VaultCardProps {
  vault: SavingsVault
  onPress: (id: string) => void
  isLoading?: boolean
}

export function VaultCard({ vault, onPress, isLoading = false }: VaultCardProps) {
  if (isLoading) {
    return <Skeleton width="100%" height={136} radius={radius.xl} />
  }

  const gradient = getGradient(vault.iconEmoji)
  const percentage = vault.targetAmount > 0
    ? Math.min((vault.currentAmount / vault.targetAmount) * 100, 100)
    : 0

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress(vault.id)
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityLabel={`${vault.name} vault, ${Math.round(percentage)}% complete`}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Lock overlay */}
        {vault.isLocked && (
          <View style={styles.lockOverlay} pointerEvents="none">
            <LockIcon />
          </View>
        )}

        {/* Top row */}
        <View style={styles.topRow}>
          <Text style={styles.emoji}>{vault.iconEmoji ?? '💰'}</Text>
          {vault.isLocked && <LockIcon />}
        </View>

        {/* Name */}
        <Text variant="h3" style={styles.name} numberOfLines={1}>
          {vault.name}
        </Text>

        {/* Target */}
        <Text variant="caption" style={styles.target}>
          Goal: {formatCurrency(vault.targetAmount, vault.currency)}
        </Text>

        {/* Progress bar */}
        <View style={{ marginTop: spacing[3] }}>
          <ProgressBar
            value={percentage}
            trackColor="rgba(255,255,255,0.15)"
            color={percentage >= 100 ? '#34D399' : '#4F8EF7'}
            height={6}
          />
        </View>

        {/* Bottom row */}
        <View style={styles.bottomRow}>
          <Text style={styles.amount}>
            {formatCurrency(vault.currentAmount, vault.currency)}
          </Text>
          <Text style={styles.percent}>
            {Math.round(percentage)}%
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing[4],
    gap: spacing[1],
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  emoji: { fontSize: 32, lineHeight: 38 },
  name: { color: '#FFFFFF', marginBottom: 2 },
  target: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  amount: {
    color: '#FFFFFF',
    fontFamily: 'DMMono_400Regular',
    fontSize: 15,
  },
  percent: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'DMMono_400Regular',
    fontSize: 13,
  },
})
