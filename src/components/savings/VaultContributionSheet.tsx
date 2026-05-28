/**
 * VaultContributionSheet — quick contribute bottom sheet.
 * Shows current progress, AmountInput, optional note, and available balance.
 * Fires confetti when the contribution reaches 100% goal.
 */

import React, { useState, useRef } from 'react'
import { View, StyleSheet, TextInput, Dimensions } from 'react-native'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { Text } from '../ui/Text'
import { AmountInput } from '../ui/AmountInput'
import { VaultProgress } from './VaultProgress'
import { useTheme } from '../../hooks/useTheme'
import { formatCurrency } from '../../lib/utils/currency'
import { spacing } from '../../theme/spacing'
import { radius } from '../../theme/radius'
import type { SavingsVault } from '../../types/savings.types'

const { width } = Dimensions.get('window')

interface VaultContributionSheetProps {
  vault: SavingsVault
  availableBalance: number
  visible: boolean
  onClose: () => void
  onSuccess: (amount: number) => void
  isContributing: boolean
  onContribute: (amount: number, note?: string) => Promise<void>
}

export function VaultContributionSheet({
  vault,
  availableBalance,
  visible,
  onClose,
  onSuccess,
  isContributing,
  onContribute,
}: VaultContributionSheetProps) {
  const { COLORS } = useTheme()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const numericAmount = parseFloat(amount) || 0
  const remaining = Math.max(vault.targetAmount - vault.currentAmount, 0)
  const wouldComplete = numericAmount > 0 && (vault.currentAmount + numericAmount) >= vault.targetAmount

  const isDisabled = numericAmount <= 0 || numericAmount > availableBalance || isContributing

  function handleClose() {
    setAmount('')
    setNote('')
    setError(null)
    onClose()
  }

  async function handleContribute() {
    if (isDisabled) return
    setError(null)
    try {
      await onContribute(numericAmount, note.trim() || undefined)
      setAmount('')
      setNote('')
      onSuccess(numericAmount)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Contribution failed. Please try again.'
      setError(msg)
    }
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose} snapPoints={[500]}>
      <View style={styles.container}>
        {/* Title */}
        <Text variant="h3" style={{ color: COLORS.text.primary, textAlign: 'center', marginBottom: spacing[4] }}>
          Add Money to {vault.name}
        </Text>

        {/* Progress ring */}
        <View style={styles.progressRow}>
          <VaultProgress
            current={vault.currentAmount}
            target={vault.targetAmount}
            currency={vault.currency}
            size={100}
            strokeWidth={8}
            emoji={vault.iconEmoji}
          />
          <View style={styles.progressInfo}>
            <Text variant="label" style={{ color: COLORS.text.secondary }}>Remaining</Text>
            <Text
              variant="h3"
              style={{ color: COLORS.text.primary, fontFamily: 'DMMono_400Regular', marginTop: 4 }}
            >
              {formatCurrency(remaining, vault.currency)}
            </Text>
            {wouldComplete && (
              <Text variant="caption" style={{ color: COLORS.status.success, marginTop: 4 }}>
                🎉 Goal complete!
              </Text>
            )}
          </View>
        </View>

        {/* Amount input */}
        <AmountInput
          value={amount}
          onChange={setAmount}
          currency={vault.currency}
          maxAmount={availableBalance}
          label="Amount to add"
        />

        {/* Note */}
        <View style={[styles.noteContainer, { borderColor: COLORS.border.default, backgroundColor: COLORS.background.secondary }]}>
          <TextInput
            style={[styles.noteInput, { color: COLORS.text.primary }]}
            placeholder="Note (optional)"
            placeholderTextColor={COLORS.text.tertiary}
            value={note}
            onChangeText={setNote}
            maxLength={80}
            returnKeyType="done"
          />
        </View>

        {/* Available balance */}
        <Text variant="caption" style={{ color: COLORS.text.tertiary, textAlign: 'center' }}>
          Available: {formatCurrency(availableBalance, vault.currency)}
        </Text>

        {/* Error */}
        {error && (
          <Text variant="caption" style={{ color: COLORS.status.error, textAlign: 'center' }}>
            {error}
          </Text>
        )}

        {/* CTA */}
        <Button
          variant="primary"
          onPress={handleContribute}
          loading={isContributing}
          disabled={isDisabled}
          fullWidth
          style={{ marginTop: spacing[2] }}
        >
          {wouldComplete ? '🎉 Complete Goal!' : 'Contribute'}
        </Button>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[6],
    gap: spacing[3],
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[5],
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  progressInfo: {
    flex: 1,
  },
  noteContainer: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  noteInput: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    minHeight: 40,
  },
})
