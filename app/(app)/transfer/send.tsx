/**
 * Send screen — Step 1 of 3.
 * Accepts a wallet number (IMR-XXXXXXXXXX format).
 * IMR- prefix is always shown, user types only the 10 digits.
 * Shows recent beneficiaries as quick-fill pills.
 */

import React, { useState, useCallback } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../../src/hooks/useTheme'
import { Screen } from '../../../src/components/layout/Screen'
import { Text } from '../../../src/components/ui/Text'
import { Button } from '../../../src/components/ui/Button'
import { Badge } from '../../../src/components/ui/Badge'
import { Skeleton } from '../../../src/components/ui/Skeleton'
import { useTransfer } from '../../../src/hooks/useTransfer'
import { useBeneficiaries } from '../../../src/hooks/useBeneficiaries'

const IMR_PREFIX = 'IMR-'
const DIGITS_LENGTH = 10

/** Validate: suffix must be exactly 10 numeric digits */
function isValidSuffix(suffix: string): boolean {
  return /^\d{10}$/.test(suffix)
}

export default function SendScreen() {
  const { COLORS, spacing, radius } = useTheme()
  // Store only the numeric suffix (10 digits max)
  const [digitSuffix, setDigitSuffix] = useState('')
  const walletNumber = IMR_PREFIX + digitSuffix
  const isValid = isValidSuffix(digitSuffix)
  const transfer = useTransfer()

  const { beneficiaries, isLoading: bLoading } = useBeneficiaries(8)

  // Auto-resolve when wallet number becomes valid
  React.useEffect(() => {
    if (isValid) transfer.resolveRecipient(walletNumber)
  }, [walletNumber, isValid])

  const handleContinue = useCallback(() => {
    if (!isValid) return
    router.push({
      pathname: '/(app)/transfer/confirm',
      params: { walletNumber },
    })
  }, [isValid, walletNumber])

  const handleSelectBeneficiary = useCallback((imariWalletNumber: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    // Strip the prefix and use only the digits portion
    const suffix = imariWalletNumber.startsWith(IMR_PREFIX)
      ? imariWalletNumber.slice(IMR_PREFIX.length)
      : imariWalletNumber
    setDigitSuffix(suffix.slice(0, DIGITS_LENGTH))
  }, [])

  function handleSuffixChange(text: string) {
    // Allow only digits, max 10 characters
    const cleaned = text.replace(/\D/g, '').slice(0, DIGITS_LENGTH)
    setDigitSuffix(cleaned)
  }

  return (
    <Screen style={{ paddingHorizontal: spacing[4] }}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text variant="caption" style={{ color: COLORS.text.tertiary }}>
            Step 1 of 3
          </Text>
          <Text variant="h2" style={{ color: COLORS.text.primary, marginTop: 2 }}>
            Send Money
          </Text>
        </View>
        <Pressable onPress={() => router.back()}>
          <Text variant="h2" style={{ color: COLORS.text.secondary }}>✕</Text>
        </Pressable>
      </View>

      {/* Wallet number input with fixed IMR- prefix */}
      <View style={{ marginTop: spacing[6] }}>
        <Text
          variant="label"
          style={{ color: COLORS.text.secondary, marginBottom: spacing[2] }}
        >
          Wallet number
        </Text>
        <View
          style={[
            styles.prefixInputRow,
            {
              borderColor: isValid ? COLORS.status.success : COLORS.border.default,
              backgroundColor: COLORS.background.secondary,
              borderRadius: radius.lg,
            },
          ]}
        >
          {/* Fixed prefix */}
          <View style={styles.prefixLabel}>
            <Text
              style={{
                fontFamily: 'DMMono_400Regular',
                fontSize: 16,
                color: COLORS.accent.primary,
                letterSpacing: 0.5,
              }}
            >
              {IMR_PREFIX}
            </Text>
          </View>

          {/* Divider */}
          <View style={[styles.prefixDivider, { backgroundColor: COLORS.border.subtle }]} />

          {/* Digit input */}
          <TextInput
            style={[
              styles.suffixInput,
              {
                color: COLORS.text.primary,
                fontFamily: 'DMMono_400Regular',
                fontSize: 16,
              },
            ]}
            value={digitSuffix}
            onChangeText={handleSuffixChange}
            placeholder="0000000000"
            placeholderTextColor={COLORS.text.tertiary}
            keyboardType="numeric"
            maxLength={DIGITS_LENGTH}
            autoFocus={false}
            returnKeyType="done"
          />

          {/* Validity badge */}
          {isValid && (
            <View style={{ marginRight: spacing[3] }}>
              <Badge variant="success" label="Valid" />
            </View>
          )}
        </View>
        <Text variant="caption" style={{ color: COLORS.text.tertiary, marginTop: spacing[1] }}>
          Enter the 10-digit recipient wallet number
        </Text>
      </View>

      {/* Recent beneficiaries */}
      {bLoading ? (
        <View style={[styles.recentRow, { marginTop: spacing[6] }]}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} width={56} height={56} radius={28} />
          ))}
        </View>
      ) : beneficiaries.length > 0 ? (
        <View style={{ marginTop: spacing[6] }}>
          <Text variant="label" style={{ color: COLORS.text.secondary, marginBottom: spacing[3] }}>
            Recent
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.recentRow, { gap: spacing[4] }]}>
              {beneficiaries.map((b) => (
                <Pressable
                  key={b.id}
                  onPress={() => handleSelectBeneficiary(b.imariWalletNumber)}
                  style={{ alignItems: 'center', width: 64 }}
                >
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: COLORS.accent.primaryMuted,
                        borderRadius: radius.full,
                      },
                    ]}
                  >
                    <Text variant="label" style={{ color: COLORS.accent.primary }}>
                      {b.displayName.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    variant="caption"
                    style={{ color: COLORS.text.tertiary, marginTop: 4, textAlign: 'center' }}
                    numberOfLines={1}
                  >
                    {b.displayName}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      ) : null}

      {/* Continue */}
      <View style={[styles.footer, { paddingBottom: spacing[8] }]}>
        <Button variant="primary" fullWidth disabled={!isValid} onPress={handleContinue}>
          Continue
        </Button>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 16,
  },
  prefixInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    minHeight: 52,
  },
  prefixLabel: {
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  prefixDivider: {
    width: 1,
    height: 28,
    marginRight: 12,
  },
  suffixInput: {
    flex: 1,
    height: 52,
    letterSpacing: 1.5,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
})
