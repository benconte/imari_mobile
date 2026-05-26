/**
 * KYC Step 0 — Document type selector.
 *
 * Shows KYC status banner for REJECTED state.
 * User selects document type then continues to document capture.
 */

import React, { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { useTheme } from '../../../src/hooks/useTheme'
import { useKYC } from '../../../src/hooks/useKYC'
import { useAuth } from '../../../src/hooks/useAuth'
import { Text } from '../../../src/components/ui/Text'
import { Button } from '../../../src/components/ui/Button'
import { Screen } from '../../../src/components/layout/Screen'
import type { KYCDocumentType } from '../../../src/types/profile.types'

const STEPS = ['Document Type', 'Capture', 'Selfie']

const DOCUMENT_OPTIONS: Array<{
  type: KYCDocumentType
  emoji: string
  label: string
  description: string
}> = [
    {
      type: 'NATIONAL_ID',
      emoji: '🪪',
      label: 'National ID',
      description: 'Rwanda National Identity Card',
    },
    {
      type: 'PASSPORT',
      emoji: '🛂',
      label: 'Passport',
      description: 'International Passport',
    },
    {
      type: 'DRIVERS_LICENSE',
      emoji: '🚗',
      label: "Driver's License",
      description: 'Rwanda Driving Permit',
    },
  ]

function StepIndicator({ current }: { current: number }) {
  const { COLORS, spacing } = useTheme()
  return (
    <View style={[styles.stepRow, { gap: spacing[2] }]}>
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                {
                  backgroundColor:
                    i <= current ? COLORS.accent.primary : COLORS.border.default,
                },
              ]}
            />
            <Text
              variant="caption"
              color={i <= current ? COLORS.accent.primary : COLORS.text.tertiary}
              style={{ marginTop: 4, textAlign: 'center' }}
            >
              {label}
            </Text>
          </View>
          {i < STEPS.length - 1 && (
            <View
              style={[
                styles.stepLine,
                {
                  backgroundColor:
                    i < current ? COLORS.accent.primary : COLORS.border.default,
                },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  )
}

export default function KYCIndexScreen() {
  const { COLORS, spacing, radius } = useTheme()
  const { kycStatus } = useKYC()
  const { logout } = useAuth()
  const [selected, setSelected] = useState<KYCDocumentType | null>(null)

  const handleContinue = () => {
    if (!selected) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push({
      pathname: '/(app)/kyc/document',
      params: { documentType: selected },
    } as never)
  }

  return (
    <Screen scrollable style={{ paddingHorizontal: spacing[6] }}>
      {/* Header */}
      <View style={{ paddingTop: spacing[6], marginBottom: spacing[6] }}>
        <Text variant="h1" color={COLORS.text.primary}>
          Verify Identity
        </Text>
        <Text variant="body" color={COLORS.text.secondary} style={{ marginTop: spacing[1] }}>
          Choose your identity document to begin
        </Text>
      </View>

      {/* Step indicator */}
      <View style={{ marginBottom: spacing[6] }}>
        <StepIndicator current={0} />
      </View>

      {/* Rejected banner */}
      {kycStatus === 'REJECTED' && (
        <View
          style={[
            styles.banner,
            {
              backgroundColor: COLORS.status.errorMuted,
              borderColor: COLORS.status.error,
              borderRadius: radius.lg,
              padding: spacing[4],
              marginBottom: spacing[5],
            },
          ]}
        >
          <Text variant="label" color={COLORS.status.error}>
            Verification Failed
          </Text>
          <Text variant="bodySmall" color={COLORS.status.error} style={{ marginTop: spacing[1] }}>
            Your previous submission was rejected. Please resubmit your documents.
          </Text>
        </View>
      )}

      {/* Document type selector */}
      <View style={{ gap: spacing[3] }}>
        {DOCUMENT_OPTIONS.map((opt) => {
          const isSelected = selected === opt.type
          return (
            <Pressable
              key={opt.type}
              onPress={() => {
                setSelected(opt.type)
                Haptics.selectionAsync()
              }}
              style={[
                styles.optionCard,
                {
                  backgroundColor: isSelected
                    ? COLORS.accent.primaryMuted
                    : COLORS.card.background,
                  borderColor: isSelected
                    ? COLORS.accent.primary
                    : COLORS.card.border,
                  borderRadius: radius.xl,
                  padding: spacing[4],
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={opt.label}
            >
              <View style={styles.optionRow}>
                <Text variant="h2" style={{ marginRight: spacing[3] }}>
                  {opt.emoji}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text
                    variant="label"
                    color={isSelected ? COLORS.accent.primary : COLORS.text.primary}
                  >
                    {opt.label}
                  </Text>
                  <Text variant="bodySmall" color={COLORS.text.secondary}>
                    {opt.description}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: isSelected
                        ? COLORS.accent.primary
                        : COLORS.border.default,
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[styles.radioFill, { backgroundColor: COLORS.accent.primary }]}
                    />
                  )}
                </View>
              </View>
            </Pressable>
          )
        })}
      </View>

      <Button
        fullWidth
        size="lg"
        disabled={!selected}
        onPress={handleContinue}
        style={{ marginTop: spacing[8], marginBottom: spacing[4] }}
        accessibilityLabel="Continue to document capture"
      >
        Continue
      </Button>

      <Pressable
        onPress={() => logout()}
        style={{ alignItems: 'center', paddingBottom: spacing[8] }}
        accessibilityRole="button"
      >
        <Text variant="bodySmall" color={COLORS.text.tertiary}>
          Sign out
        </Text>
      </Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' },
  stepItem: { alignItems: 'center', width: 64 },
  stepDot: { width: 10, height: 10, borderRadius: 5 },
  stepLine: { flex: 1, height: 1, marginTop: 5 },
  banner: { borderWidth: 1 },
  optionCard: { borderWidth: 1.5 },
  optionRow: { flexDirection: 'row', alignItems: 'center' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioFill: { width: 10, height: 10, borderRadius: 5 },
})
