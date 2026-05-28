/**
 * AmountStep — Step 2 of transfer confirm screen.
 * Full-screen AmountInput + recipient preview row + optional description.
 */

import React, { useState } from 'react'
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useTheme } from '../../hooks/useTheme'
import { AmountInput } from '../ui/AmountInput'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Text } from '../ui/Text'
import { Skeleton } from '../ui/Skeleton'
import { Badge } from '../ui/Badge'
import type { ResolvedRecipient } from '../../types/transfer.types'

interface AmountStepProps {
  walletNumber: string
  resolvedRecipient: ResolvedRecipient | null
  isResolving: boolean
  currency: string
  onContinue: (amount: string, description: string) => void
  balance?: number
}

export function AmountStep({
  walletNumber,
  resolvedRecipient,
  isResolving,
  currency,
  onContinue,
  balance,
}: AmountStepProps) {
  const { COLORS, spacing, radius } = useTheme()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  const numericAmount = parseFloat(amount || '0')
  const canContinue = numericAmount > 0 && (!balance || numericAmount <= balance)

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: spacing[4] }]}>
          <Text variant="caption" style={{ color: COLORS.text.tertiary }}>
            Step 2 of 3
          </Text>
        </View>

        {/* Amount input */}
        <View style={[styles.amountContainer, { paddingHorizontal: spacing[4] }]}>
          <AmountInput
            value={amount}
            onChange={setAmount}
            currency={currency}
            label="How much to send?"
            maxAmount={balance}
          />
        </View>

        {/* Recipient row + description */}
        <View style={[styles.footer, { paddingHorizontal: spacing[4], gap: spacing[3] }]}>
          {/* Recipient preview */}
          <View
            style={[
              styles.recipientRow,
              {
                backgroundColor: COLORS.background.secondary,
                borderRadius: radius.lg,
                padding: spacing[3],
              },
            ]}
          >
            <View
              style={[
                styles.avatar,
                { backgroundColor: COLORS.accent.primaryMuted, borderRadius: radius.full },
              ]}
            >
              <Text variant="label" style={{ color: COLORS.accent.primary }}>
                {walletNumber.slice(-2)}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing[3] }}>
              <Text variant="label" style={{ color: COLORS.text.secondary }}>
                Sending to
              </Text>
              {isResolving ? (
                <Skeleton width={120} height={16} style={{ marginTop: 4 }} />
              ) : (
                <Text variant="body" style={{ color: COLORS.text.primary }}>
                  {resolvedRecipient?.name ?? walletNumber}
                </Text>
              )}
            </View>
            <Badge variant="neutral" label={currency} />
          </View>

          {/* Optional description */}
          <Input
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            maxLength={100}
            placeholder="e.g. Monthly support"
          />

          {/* Continue button */}
          <Button
            variant="primary"
            fullWidth
            disabled={!canContinue}
            onPress={() => onContinue(amount, description)}
          >
            Continue to PIN
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 16 },
  amountContainer: { flex: 1 },
  footer: { paddingBottom: 32 },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
