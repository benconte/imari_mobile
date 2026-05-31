/**
 * Create wallet — 2-step flow: currency selection → review & confirm.
 * Calls POST /wallet with selected currency.
 * Grays out currencies already in use by existing wallets.
 */

import React, { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import Svg, { Path } from 'react-native-svg'
import { Text } from '../../../src/components/ui/Text'
import { Button } from '../../../src/components/ui/Button'
import { WalletCard } from '../../../src/components/wallet/WalletCard'
import { useWallet } from '../../../src/hooks/useWallet'
import { useTheme } from '../../../src/hooks/useTheme'
import { spacing } from '../../../src/theme/spacing'
import { radius } from '../../../src/theme/radius'
import type { Wallet } from '../../../src/types/wallet.types'
import { AxiosError } from 'axios'

// ─── Currency data ────────────────────────────────────────────────────────────

interface CurrencyOption {
  code: string
  flag: string
  name: string
}

const CURRENCIES: CurrencyOption[] = [
  { code: 'RWF', flag: '🇷🇼', name: 'Rwandan Franc' },
  { code: 'USD', flag: '🇺🇸', name: 'US Dollar' },
  { code: 'EUR', flag: '🇪🇺', name: 'Euro' },
  { code: 'GBP', flag: '🇬🇧', name: 'British Pound' },
  { code: 'KES', flag: '🇰🇪', name: 'Kenyan Shilling' },
  { code: 'UGX', flag: '🇺🇬', name: 'Ugandan Shilling' },
]

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
  const { COLORS } = useTheme()
  return (
    <View style={stepStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            stepStyles.dot,
            { backgroundColor: i <= step ? COLORS.accent.primary : COLORS.border.default },
          ]}
        />
      ))}
    </View>
  )
}

const stepStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  dot: { width: 32, height: 4, borderRadius: 2 },
})

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CreateWalletScreen() {
  const router = useRouter()
  const { COLORS } = useTheme()
  const { allWallets, createWallet, isCreating } = useWallet()

  const [step, setStep] = useState(0)
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null)

  const usedCurrencies = new Set(allWallets.map((w) => w.currency))

  const previewWallet: Wallet = {
    id: 'preview',
    walletNumber: 'IMR-XXXXXXXXXX',
    currency: selectedCurrency ?? 'USD',
    balance: 0,
    availableBalance: 0,
    status: 'ACTIVE',
    isPrimary: false,
    createdAt: new Date().toISOString(),
  }

  async function handleCreate() {
    if (!selectedCurrency) return
    try {
      const created = await createWallet({ currency: selectedCurrency })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.replace(`/(app)/wallet`)
    } catch (err) {
      const msg = (err as AxiosError)
        // @ts-ignore
        ?.response?.data?.message ?? 'Failed to create wallet. Please try again.'
      Alert.alert('Error', msg)
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: COLORS.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: spacing[12] }]}>
        <Pressable
          onPress={() => (step === 0 ? router.back() : setStep(0))}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Go back"
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M19 12H5M12 19l-7-7 7-7" stroke={COLORS.accent.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
        <Text variant="h2" style={{ color: COLORS.text.primary }}>
          {step === 0 ? 'Choose Currency' : 'Review & Confirm'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <StepIndicator step={step} total={2} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Step 0: Currency selection ── */}
        {step === 0 && (
          <>
            <Text variant="body" style={{ color: COLORS.text.secondary, textAlign: 'center' }}>
              Select a currency for your new wallet.
            </Text>
            <View style={styles.grid}>
              {CURRENCIES.map((c) => {
                const isUsed = usedCurrencies.has(c.code)
                const isSelected = selectedCurrency === c.code
                return (
                  <Pressable
                    key={c.code}
                    onPress={() => {
                      if (isUsed) return
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      setSelectedCurrency(c.code)
                    }}
                    style={[
                      styles.currencyCard,
                      {
                        backgroundColor: isSelected
                          ? COLORS.accent.primaryMuted
                          : COLORS.background.secondary,
                        borderColor: isSelected
                          ? COLORS.accent.primary
                          : COLORS.border.subtle,
                        opacity: isUsed ? 0.4 : 1,
                      },
                    ]}
                    accessibilityLabel={`${c.name}${isUsed ? ', already have this wallet' : ''}`}
                  >
                    <Text style={styles.currencyFlag}>{c.flag}</Text>
                    <Text variant="label" style={{ color: COLORS.text.primary }}>
                      {c.code}
                    </Text>
                    <Text variant="caption" style={{ color: COLORS.text.tertiary, textAlign: 'center' }}>
                      {c.name}
                    </Text>
                    {isUsed && (
                      <Text variant="caption" style={{ color: COLORS.status.warning, fontSize: 9 }}>
                        Already owned
                      </Text>
                    )}
                  </Pressable>
                )
              })}
            </View>

            <Button
              variant="primary"
              fullWidth
              disabled={!selectedCurrency}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setStep(1) }}
            >
              Continue
            </Button>
          </>
        )}

        {/* ── Step 1: Review & Confirm ── */}
        {step === 1 && selectedCurrency && (
          <>
            <WalletCard
              wallet={previewWallet}
              onPress={() => { }}
              onMorePress={() => { }}
            />

            {/* Info card */}
            <View style={[styles.infoCard, { backgroundColor: COLORS.status.infoMuted, borderColor: COLORS.accent.primaryMuted }]}>
              <Text variant="body" style={{ color: COLORS.accent.primary, fontFamily: 'DMSans_600SemiBold' }}>
                ℹ️  Good to know
              </Text>
              <Text variant="caption" style={{ color: COLORS.text.secondary, marginTop: spacing[1] }}>
                • You can fund your new wallet after creation
              </Text>
              <Text variant="caption" style={{ color: COLORS.text.secondary }}>
                • Each wallet operates independently
              </Text>
              <Text variant="caption" style={{ color: COLORS.text.secondary }}>
                • Maximum 5 wallets per account
              </Text>
            </View>

            <Button
              variant="primary"
              fullWidth
              loading={isCreating}
              onPress={handleCreate}
            >
              Create {selectedCurrency} Wallet
            </Button>
            <Button
              variant="ghost"
              fullWidth
              onPress={() => setStep(0)}
              disabled={isCreating}
            >
              Back
            </Button>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[16],
    gap: spacing[4],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  currencyCard: {
    width: '30%',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: radius.xl,
    borderWidth: 1.5,
    gap: spacing[1],
  },
  currencyFlag: { fontSize: 28 },
  infoCard: {
    padding: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing[1],
  },
})
