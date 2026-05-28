/**
 * PinStep — Step 3 of transfer confirm screen.
 * Full-screen PinInput that initiates the transfer mutation on completion.
 */

import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from '../../hooks/useTheme'
import { PinInput } from '../ui/PinInput'
import { Text } from '../ui/Text'

interface PinStepProps {
  amount: string
  currency: string
  recipientName: string
  isLoading: boolean
  error: string | null
  onComplete: (pin: string) => void
  onBiometric?: () => void
  onClearError?: () => void
}

function formatDisplayAmount(amount: string, currency: string): string {
  const num = parseFloat(amount || '0')
  return `${currency} ${num.toLocaleString()}`
}

export function PinStep({
  amount,
  currency,
  recipientName,
  isLoading,
  error,
  onComplete,
  onBiometric,
  onClearError,
}: PinStepProps) {
  const { spacing } = useTheme()

  return (
    <View style={[styles.container, { padding: spacing[4] }]}>
      {/* Step indicator */}
      <View style={styles.stepRow}>
        <Text variant="caption" style={{ color: '#6B7280', textAlign: 'center' }}>
          Step 3 of 3
        </Text>
      </View>

      <PinInput
        title="Confirm Transfer"
        subtitle={`Sending ${formatDisplayAmount(amount, currency)} to ${recipientName}`}
        onComplete={onComplete}
        onBiometric={onBiometric}
        onClearError={onClearError}
        error={error}
        loading={isLoading}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stepRow: { paddingBottom: 8 },
})
