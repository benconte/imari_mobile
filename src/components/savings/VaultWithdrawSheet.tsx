/**
 * VaultWithdrawSheet — bottom sheet for withdrawing money from a vault.
 * Validates against locked vaults and available vault balance.
 */

import React, { useState } from 'react'
import { View, StyleSheet, TextInput, ScrollView } from 'react-native'
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

interface VaultWithdrawSheetProps {
  vault: SavingsVault
  visible: boolean
  onClose: () => void
  onSuccess: (amount: number) => void
  isWithdrawing: boolean
  onWithdraw: (amount: number, note?: string) => Promise<void>
}

export function VaultWithdrawSheet({
  vault,
  visible,
  onClose,
  onSuccess,
  isWithdrawing,
  onWithdraw,
}: VaultWithdrawSheetProps) {
  const { COLORS } = useTheme()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const numericAmount = parseFloat(amount) || 0
  const remainingInVault = Math.max(vault.currentAmount - numericAmount, 0)

  // Disallow withdrawal if amount > currentAmount, or if locked
  const isDisabled =
    numericAmount <= 0 ||
    numericAmount > 500 ||
    vault.isLocked ||
    isWithdrawing

  function handleClose() {
    setAmount('')
    setNote('')
    setError(null)
    onClose()
  }

  async function handleWithdraw() {
    if (isDisabled) return
    setError(null)
    try {
      await onWithdraw(numericAmount, note.trim() || undefined)
      setAmount('')
      setNote('')
      onSuccess(numericAmount)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Withdrawal failed. Please try again.'
      setError(msg)
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      snapPoints={[640]}
      disableAnimation
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Title */}
        <Text
          variant="h3"
          style={{ color: COLORS.text.primary, textAlign: 'center', marginBottom: spacing[4] }}
        >
          Withdraw from {vault.name}
        </Text>

        {/* Progress ring - updated to reflect remaining amount */}
        <View style={styles.progressRow}>
          <VaultProgress
            current={remainingInVault}
            target={vault.targetAmount}
            currency={vault.currency}
            size={96}
            strokeWidth={8}
            emoji={vault.iconEmoji}
          />
          <View style={styles.progressInfo}>
            <Text variant="label" style={{ color: COLORS.text.secondary }}>
              New Balance
            </Text>
            <Text
              variant="h3"
              style={{ color: COLORS.text.primary, fontFamily: 'DMMono_400Regular', marginTop: 4 }}
            >
              {formatCurrency(remainingInVault, vault.currency)}
            </Text>
            {vault.isLocked && (
              <Text variant="caption" style={{ color: COLORS.status.warning, marginTop: 4 }}>
                ⚠️ Vault is locked until {vault.lockUntil ? new Date(vault.lockUntil).toLocaleDateString() : 'its deadline'}
              </Text>
            )}
          </View>
        </View>

        {/* Amount input */}
        <AmountInput
          value={amount}
          onChange={setAmount}
          currency={vault.currency}
          maxAmount={vault.currentAmount}
          label="Amount to withdraw"
          errorMessage="Exceeds what's available in the vault"
        />

        {/* Available balance in vault */}
        <Text
          variant="caption"
          style={{ color: COLORS.text.tertiary, textAlign: 'center', marginTop: spacing[1] }}
        >
          Available in vault: {formatCurrency(vault.currentAmount, vault.currency)}
        </Text>

        {/* Note input */}
        <View
          style={[
            styles.noteContainer,
            { borderColor: COLORS.border.default, backgroundColor: COLORS.background.secondary },
          ]}
        >
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

        {/* Error */}
        {error && (
          <Text
            variant="caption"
            style={{ color: COLORS.status.error, textAlign: 'center', marginTop: spacing[1] }}
          >
            {error}
          </Text>
        )}

        {/* CTA */}
        <Button
          variant="primary"
          onPress={handleWithdraw}
          loading={isWithdrawing}
          disabled={isDisabled}
          fullWidth
          style={{ marginTop: spacing[3] }}
        >
          Withdraw Money
        </Button>
      </ScrollView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
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
    minHeight: 44,
  },
})
