/**
 * Fund wallet screen — top-up flow.
 * Reads walletId from query param.
 *
 * Step 0: Choose provider (MTN MoMo / Airtel / Bank Transfer)
 *         MoMo options show "Coming Soon" since backend has no MoMo integration yet.
 * Step 1: Bank transfer → Shows Imari bank account details with copy buttons.
 *
 * Backend note: POST /wallet/fund does not exist yet.
 * This screen handles bank transfer details only until MoMo is integrated.
 */

import React, { useState } from 'react'
import { Alert, Clipboard, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as Haptics from 'expo-haptics'
import Svg, { Path, Circle } from 'react-native-svg'
import { Text } from '../../../src/components/ui/Text'
import { Button } from '../../../src/components/ui/Button'
import { Badge } from '../../../src/components/ui/Badge'
import { useWallet } from '../../../src/hooks/useWallet'
import { useTheme } from '../../../src/hooks/useTheme'
import { spacing } from '../../../src/theme/spacing'
import { radius } from '../../../src/theme/radius'

type Provider = 'MTN_MOMO' | 'AIRTEL_MONEY' | 'BANK_TRANSFER'
type Step = 'provider' | 'details'

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: Step }) {
  const { COLORS } = useTheme()
  const steps: Step[] = ['provider', 'details']
  const labels = ['Provider', 'Details']
  return (
    <View style={stepStyles.row}>
      {steps.map((s, i) => (
        <View key={s} style={stepStyles.item}>
          <View style={[stepStyles.dot, { backgroundColor: steps.indexOf(step) >= i ? COLORS.accent.primary : COLORS.border.default }]} />
          <Text variant="caption" style={{ color: steps.indexOf(step) >= i ? COLORS.accent.primary : COLORS.text.tertiary, fontSize: 10 }}>
            {labels[i]}
          </Text>
        </View>
      ))}
    </View>
  )
}

const stepStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: spacing[4] },
  item: { alignItems: 'center', gap: 4 },
  dot: { width: 48, height: 4, borderRadius: 2 },
})

// ─── Provider card ────────────────────────────────────────────────────────────

interface ProviderCardProps {
  provider: Provider
  logo: string
  name: string
  subtitle: string
  selected: boolean
  comingSoon?: boolean
  onSelect: () => void
  logoColor: string
}

function ProviderCard({ logo, name, subtitle, selected, comingSoon, onSelect, logoColor }: ProviderCardProps) {
  const { COLORS } = useTheme()
  return (
    <Pressable
      onPress={comingSoon ? undefined : onSelect}
      style={[
        pcStyles.card,
        {
          backgroundColor: selected ? COLORS.accent.primaryMuted : COLORS.background.secondary,
          borderColor: selected ? COLORS.accent.primary : COLORS.border.subtle,
          opacity: comingSoon ? 0.55 : 1,
        },
      ]}
      accessibilityLabel={name}
    >
      <View style={[pcStyles.logo, { backgroundColor: logoColor }]}>
        <Text style={{ fontSize: 16, fontFamily: 'DMSans_700Bold', color: '#000' }}>{logo}</Text>
      </View>
      <View style={pcStyles.info}>
        <View style={pcStyles.nameRow}>
          <Text variant="body" style={{ color: COLORS.text.primary, fontFamily: 'DMSans_600SemiBold' }}>
            {name}
          </Text>
          {comingSoon && <Badge label="Soon" variant="warning" size="sm" />}
        </View>
        <Text variant="caption" style={{ color: COLORS.text.secondary }}>
          {subtitle}
        </Text>
      </View>
      {selected && !comingSoon && (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" fill={COLORS.accent.primary} />
          <Path d="M8 12l3 3 5-6" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}
    </Pressable>
  )
}

const pcStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1.5,
    gap: spacing[3],
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
})

// ─── Copy row ──────────────────────────────────────────────────────────────────

function CopyRow({ label, value }: { label: string; value: string }) {
  const { COLORS } = useTheme()

  function handleCopy() {
    Clipboard.setString(value)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    Alert.alert('Copied', `${label} copied to clipboard`)
  }

  return (
    <View style={[crStyles.row, { borderColor: COLORS.border.subtle }]}>
      <View style={crStyles.info}>
        <Text variant="caption" style={{ color: COLORS.text.tertiary }}>{label}</Text>
        <Text variant="body" style={{ color: COLORS.text.primary, fontFamily: 'DMMono_400Regular' }}>
          {value}
        </Text>
      </View>
      <Pressable
        onPress={handleCopy}
        style={[crStyles.copyBtn, { backgroundColor: COLORS.accent.primaryMuted }]}
        accessibilityLabel={`Copy ${label}`}
      >
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path d="M8 4v12h12V4H8zM4 8v12h12" stroke={COLORS.accent.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        <Text variant="caption" style={{ color: COLORS.accent.primary }}>Copy</Text>
      </Pressable>
    </View>
  )
}

const crStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[3],
  },
  info: { flex: 1, gap: 2 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
})

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function FundWalletScreen() {
  const { walletId } = useLocalSearchParams<{ walletId: string }>()
  const router = useRouter()
  const { COLORS } = useTheme()
  const { allWallets } = useWallet()

  const wallet = allWallets.find((w) => w.id === walletId) ?? allWallets[0]

  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [step, setStep] = useState<Step>('provider')

  function handleContinue() {
    if (!selectedProvider) return
    if (selectedProvider !== 'BANK_TRANSFER') return // shouldn't reach here due to disabled state
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setStep('details')
  }

  const reference = wallet?.walletNumber ?? 'IMR-XXXXXXXXXX'
  const accountName = 'Imari Technologies Ltd'
  const accountNumber = '000-123-456-789'
  const bankName = 'Bank of Kigali'

  return (
    <View style={[styles.screen, { backgroundColor: COLORS.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: spacing[12] }]}>
        <Pressable
          onPress={() => (step === 'provider' ? router.back() : setStep('provider'))}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Go back"
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M19 12H5M12 19l-7-7 7-7" stroke={COLORS.accent.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
        <Text variant="h2" style={{ color: COLORS.text.primary }}>
          Fund Wallet
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <StepIndicator step={step} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Wallet context */}
        {wallet && (
          <View style={[styles.walletTag, { backgroundColor: COLORS.background.secondary, borderColor: COLORS.border.subtle }]}>
            <Text variant="caption" style={{ color: COLORS.text.tertiary }}>Funding wallet</Text>
            <Text variant="body" style={{ color: COLORS.text.primary, fontFamily: 'DMSans_600SemiBold' }}>
              {wallet.currency} Wallet · {wallet.walletNumber}
            </Text>
          </View>
        )}

        {/* ── Step: Provider ── */}
        {step === 'provider' && (
          <>
            <Text variant="body" style={{ color: COLORS.text.secondary }}>
              Choose how you want to fund your wallet.
            </Text>

            <ProviderCard
              provider="MTN_MOMO"
              logo="MTN"
              name="MTN Mobile Money"
              subtitle="Available 24/7 · Instant"
              selected={selectedProvider === 'MTN_MOMO'}
              comingSoon
              onSelect={() => setSelectedProvider('MTN_MOMO')}
              logoColor="#FFCB00"
            />
            <ProviderCard
              provider="AIRTEL_MONEY"
              logo="AIR"
              name="Airtel Money"
              subtitle="Available 24/7 · Instant"
              selected={selectedProvider === 'AIRTEL_MONEY'}
              comingSoon
              onSelect={() => setSelectedProvider('AIRTEL_MONEY')}
              logoColor="#FF4000"
            />
            <ProviderCard
              provider="BANK_TRANSFER"
              logo="🏦"
              name="Bank Transfer"
              subtitle="1–2 business days"
              selected={selectedProvider === 'BANK_TRANSFER'}
              onSelect={() => setSelectedProvider('BANK_TRANSFER')}
              logoColor="#4F8EF726"
            />

            <Button
              variant="primary"
              fullWidth
              disabled={!selectedProvider || selectedProvider !== 'BANK_TRANSFER'}
              onPress={handleContinue}
            >
              Continue
            </Button>
            {selectedProvider && selectedProvider !== 'BANK_TRANSFER' && (
              <Text variant="caption" style={{ color: COLORS.text.tertiary, textAlign: 'center' }}>
                Mobile money integration coming soon. Use bank transfer for now.
              </Text>
            )}
          </>
        )}

        {/* ── Step: Bank details ── */}
        {step === 'details' && (
          <>
            <View style={[styles.bankCard, { backgroundColor: COLORS.background.secondary, borderColor: COLORS.border.subtle }]}>
              <Text variant="h3" style={{ color: COLORS.text.primary, marginBottom: spacing[3] }}>
                🏦  Bank Transfer Details
              </Text>
              <CopyRow label="Bank" value={bankName} />
              <CopyRow label="Account Name" value={accountName} />
              <CopyRow label="Account Number" value={accountNumber} />
              <CopyRow label="Reference (required)" value={reference} />
            </View>

            <View style={[styles.warningCard, { backgroundColor: COLORS.status.warningMuted, borderColor: COLORS.status.warningMuted }]}>
              <Text variant="caption" style={{ color: COLORS.status.warning, fontFamily: 'DMSans_600SemiBold' }}>
                ⚠️  Important
              </Text>
              <Text variant="caption" style={{ color: COLORS.text.secondary, marginTop: 4 }}>
                Always include the reference number when making the transfer. Without it, your payment may not be credited to your wallet.
              </Text>
            </View>

            <Text variant="caption" style={{ color: COLORS.text.tertiary, textAlign: 'center' }}>
              Transfer may take 1–2 business days to reflect in your wallet.
            </Text>

            <Button
              variant="primary"
              fullWidth
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                Alert.alert(
                  'Transfer Initiated',
                  'Your bank transfer has been noted. It may take 1–2 business days to reflect. Check your wallet balance after that.',
                  [{ text: 'Got it', onPress: () => router.back() }],
                )
              }}
            >
              I&apos;ve Made the Transfer
            </Button>
            <Button
              variant="ghost"
              fullWidth
              onPress={() => router.back()}
            >
              Cancel
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
  walletTag: {
    padding: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 2,
  },
  bankCard: {
    padding: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  warningCard: {
    padding: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1,
  },
})
