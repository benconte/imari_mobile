/**
 * Create vault flow — 4 steps:
 *   0: Name & Emoji
 *   1: Target Amount
 *   2: Target Date
 *   3: Lock Settings + Review
 *
 * Uses StepIndicator, AmountInput, Switch primitives.
 * Slide transitions between steps.
 */

import React, { useState, useMemo } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import { useRouter } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../../src/hooks/useTheme'
import { useSavings } from '../../../src/hooks/useSavings'
import { useWallet } from '../../../src/hooks/useWallet'
import { Text } from '../../../src/components/ui/Text'
import { Input } from '../../../src/components/ui/Input'
import { Button } from '../../../src/components/ui/Button'
import { Card } from '../../../src/components/ui/Card'
import { AmountInput } from '../../../src/components/ui/AmountInput'
import { StepIndicator } from '../../../src/components/ui/StepIndicator'
import { Switch } from '../../../src/components/ui/Switch'
import { formatCurrency } from '../../../src/lib/utils/currency'
import { spacing } from '../../../src/theme/spacing'
import { radius } from '../../../src/theme/radius'
import Svg, { Path } from 'react-native-svg'

const { width } = Dimensions.get('window')

const CURATED_EMOJIS = [
  '🏠', '✈️', '💻', '🎓', '💍', '🚗', '💰', '📱',
  '🏋️', '🎮', '🌍', '👶', '🏖️', '🎵', '📚', '🏥',
  '🎁', '🌱', '🐾', '⚡', '🎨', '🏆', '🚀', '💎',
]

const STEP_LABELS = ['Name', 'Wallet', 'Target', 'Date', 'Lock']

// ─── Step 1: Wallet ──────────────────────────────────────────────────────────
function WalletStep({
  selectedWalletId, allWallets, onSelect, onNext
}: {
  selectedWalletId: string
  allWallets: any[]
  onSelect: (id: string) => void
  onNext: () => void
}) {
  const { COLORS } = useTheme()
  return (
    <View style={styles.step}>
      <Text variant="h2" style={{ color: COLORS.text.primary, marginBottom: spacing[2] }}>
        Select a wallet
      </Text>
      <Text variant="body" style={{ color: COLORS.text.secondary, marginBottom: spacing[5] }}>
        Choose which wallet to link to this vault.
      </Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {allWallets.map(w => {
          const isSelected = selectedWalletId === w.id
          return (
            <TouchableOpacity
              key={w.id}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(w.id) }}
              style={[
                {
                  backgroundColor: COLORS.background.secondary,
                  padding: spacing[4],
                  borderRadius: radius.lg,
                  marginBottom: spacing[3],
                  borderWidth: 2,
                  borderColor: isSelected ? COLORS.accent.primary : 'transparent',
                }
              ]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text variant="body" style={{ color: COLORS.text.primary, fontFamily: 'DMMono_500Medium' }}>
                  {w.isPrimary ? 'Primary Wallet' : 'Wallet'}
                </Text>
                {isSelected && (
                  <Text variant="body" style={{ color: COLORS.accent.primary }}>✓</Text>
                )}
              </View>
              <Text variant="caption" style={{ color: COLORS.text.secondary, marginBottom: 8 }}>
                {w.walletNumber}
              </Text>
              <Text variant="label" style={{ color: COLORS.text.primary }}>
                Balance: {formatCurrency(w.balance, w.currency)}
              </Text>
            </TouchableOpacity>
          )
        })}
        <Button
          variant="primary"
          fullWidth
          onPress={onNext}
          disabled={!selectedWalletId}
          style={{ marginTop: spacing[6] }}
        >
          Continue
        </Button>
      </ScrollView>
    </View>
  )
}


const DATE_QUICK_OPTIONS = [
  { label: '3 months', days: 90 },
  { label: '6 months', days: 180 },
  { label: '1 year', days: 365 },
  { label: '2 years', days: 730 },
  { label: 'No deadline', days: 0 },
]

// ─── Step 0: Name & Emoji ────────────────────────────────────────────────────
function NameStep({
  emoji, name, description,
  onEmojiChange, onNameChange, onDescriptionChange,
  onNext,
}: {
  emoji: string
  name: string
  description: string
  onEmojiChange: (e: string) => void
  onNameChange: (n: string) => void
  onDescriptionChange: (d: string) => void
  onNext: () => void
}) {
  const { COLORS } = useTheme()
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.step}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text variant="h2" style={{ color: COLORS.text.primary, marginBottom: spacing[6] }}>
          What are you saving for?
        </Text>

        {/* Emoji grid */}
        <Text variant="label" style={{ color: COLORS.text.secondary, marginBottom: spacing[3] }}>
          Choose an icon
        </Text>
        <View style={styles.emojiGrid}>
          {CURATED_EMOJIS.map((e) => (
            <TouchableOpacity
              key={e}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onEmojiChange(e) }}
              style={[
                styles.emojiCell,
                { backgroundColor: COLORS.background.secondary },
                emoji === e && { backgroundColor: COLORS.accent.primaryMuted, borderWidth: 2, borderColor: COLORS.accent.primary },
              ]}
            >
              <Text style={{ fontSize: 28 }}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ gap: spacing[3], marginTop: spacing[4] }}>
          <Input
            label="Vault name"
            value={name}
            onChangeText={onNameChange}
            placeholder="e.g. Emergency Fund"
            maxLength={40}
            returnKeyType="next"
          />
          <Input
            label="Description (optional)"
            value={description}
            onChangeText={onDescriptionChange}
            placeholder="What is this vault for?"
            maxLength={120}
          />
        </View>

        <Button
          variant="primary"
          fullWidth
          onPress={onNext}
          disabled={!name.trim()}
          style={{ marginTop: spacing[6] }}
        >
          Continue
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── Step 1: Target Amount ───────────────────────────────────────────────────
function TargetStep({
  amount, currency, onAmountChange, onNext,
}: {
  amount: string
  currency: string
  onAmountChange: (a: string) => void
  onNext: () => void
}) {
  const numericAmount = parseFloat(amount) || 0
  return (
    <View style={{ flex: 1, paddingHorizontal: spacing[4] }}>
      {/* AmountInput fills the space above the button */}
      <View style={{ flex: 1, paddingBottom: spacing[4] }}>
        <AmountInput
          value={amount}
          onChange={onAmountChange}
          currency={currency}
          label="Set your savings goal"
        />
      </View>

      {/* Button sits in normal flow, below the keypad */}
      <Button
        variant="primary"
        fullWidth
        onPress={onNext}
        disabled={numericAmount <= 0}
        style={{ marginBottom: spacing[8] }}
      >
        Continue
      </Button>
    </View>
  )
}

// ─── Step 2: Target Date ─────────────────────────────────────────────────────
function DateStep({
  targetDate, onDateChange, targetAmount, currency, onNext,
}: {
  targetDate: string | null
  onDateChange: (d: string | null) => void
  targetAmount: number
  currency: string
  onNext: () => void
}) {
  const { COLORS } = useTheme()
  const [showCustom, setShowCustom] = useState(false)
  const [customDate, setCustomDate] = useState('')

  const monthlyEstimate = useMemo(() => {
    if (!targetDate || targetAmount <= 0) return null
    const msLeft = new Date(targetDate).getTime() - Date.now()
    if (msLeft <= 0) return null
    const monthsLeft = msLeft / (30 * 86_400_000)
    return Math.ceil(targetAmount / monthsLeft)
  }, [targetDate, targetAmount])

  function selectOption(option: { label: string; days: number }) {
    if (option.days === 0) {
      onDateChange(null)
      setShowCustom(false)
    } else {
      const d = new Date(Date.now() + option.days * 86_400_000).toISOString().split('T')[0]
      onDateChange(d)
      setShowCustom(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.step}>
      <Text variant="h2" style={{ color: COLORS.text.primary, marginBottom: spacing[2] }}>
        When's your goal date?
      </Text>
      <Text variant="body" style={{ color: COLORS.text.secondary, marginBottom: spacing[5] }}>
        Set a target to stay motivated.
      </Text>

      <View style={styles.chipGrid}>
        {DATE_QUICK_OPTIONS.map((opt) => {
          const optDate = opt.days > 0
            ? new Date(Date.now() + opt.days * 86_400_000).toISOString().split('T')[0]
            : null
          const isSelected = targetDate === optDate && !showCustom

          return (
            <TouchableOpacity
              key={opt.label}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); selectOption(opt) }}
              style={[
                styles.chip,
                { backgroundColor: COLORS.background.secondary, borderColor: COLORS.border.default },
                isSelected && { backgroundColor: COLORS.accent.primaryMuted, borderColor: COLORS.accent.primary },
              ]}
            >
              <Text variant="body" style={{ color: isSelected ? COLORS.accent.primary : COLORS.text.primary }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          )
        })}
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowCustom(true) }}
          style={[
            styles.chip,
            { backgroundColor: COLORS.background.secondary, borderColor: COLORS.border.default },
            showCustom && { backgroundColor: COLORS.accent.primaryMuted, borderColor: COLORS.accent.primary },
          ]}
        >
          <Text variant="body" style={{ color: showCustom ? COLORS.accent.primary : COLORS.text.primary }}>
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {showCustom && (
        <View style={{ marginTop: spacing[4] }}>
          <Input
            label="Target date (YYYY-MM-DD)"
            value={customDate}
            onChangeText={(v) => { setCustomDate(v); if (/^\d{4}-\d{2}-\d{2}$/.test(v)) onDateChange(v) }}
            placeholder="2026-12-31"
            keyboardType="numbers-and-punctuation"
          />
        </View>
      )}

      {monthlyEstimate && (
        <Card style={{ marginTop: spacing[4] }}>
          <Text variant="caption" style={{ color: COLORS.text.secondary }}>Monthly savings needed</Text>
          <Text variant="h3" style={{ color: COLORS.accent.primary, fontFamily: 'DMMono_400Regular', marginTop: 4 }}>
            ~{formatCurrency(monthlyEstimate, currency)}/mo
          </Text>
        </Card>
      )}

      <Button variant="primary" fullWidth onPress={onNext} style={{ marginTop: spacing[6] }}>
        Continue
      </Button>
    </KeyboardAvoidingView>
  )
}

// ─── Step 3: Lock Settings + Review ─────────────────────────────────────────
function LockStep({
  name, emoji, targetAmount, targetDate, currency,
  isLocked, lockUntil,
  onLockChange, onLockUntilChange,
  onSubmit, isCreating,
}: {
  name: string; emoji: string; targetAmount: number; targetDate: string | null
  currency: string; isLocked: boolean; lockUntil: string
  onLockChange: (v: boolean) => void; onLockUntilChange: (d: string) => void
  onSubmit: () => void; isCreating: boolean
}) {
  const { COLORS } = useTheme()

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.step}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text variant="h2" style={{ color: COLORS.text.primary, marginBottom: spacing[6] }}>
          Lock settings
        </Text>

        <Card style={{ marginBottom: spacing[4] }}>
          <Switch
            value={isLocked}
            onChange={onLockChange}
            label="Lock this vault"
          />
          {isLocked && (
            <>
              <Text variant="caption" style={{ color: COLORS.status.warning, marginTop: spacing[3] }}>
                ⚠️ Locked vaults cannot be withdrawn from until the unlock date.
              </Text>
              <View style={{ marginTop: spacing[3] }}>
                <Input
                  label="Lock until (YYYY-MM-DD)"
                  value={lockUntil}
                  onChangeText={onLockUntilChange}
                  placeholder="2027-01-01"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </>
          )}
        </Card>

        {/* Summary card */}
        <Text variant="h3" style={{ color: COLORS.text.primary, marginBottom: spacing[3] }}>
          Summary
        </Text>
        <Card>
          <View style={{ gap: spacing[3] }}>
            <View style={styles.summaryRow}>
              <Text style={{ fontSize: 28 }}>{emoji}</Text>
              <Text variant="h3" style={{ color: COLORS.text.primary, flex: 1 }}>{name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="label" style={{ color: COLORS.text.secondary }}>Target</Text>
              <Text style={{ color: COLORS.text.primary, fontFamily: 'DMMono_400Regular' }}>
                {formatCurrency(targetAmount, currency)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="label" style={{ color: COLORS.text.secondary }}>Deadline</Text>
              <Text style={{ color: COLORS.text.primary }}>
                {targetDate ? new Date(targetDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'No deadline'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="label" style={{ color: COLORS.text.secondary }}>Lock</Text>
              <Text style={{ color: COLORS.text.primary }}>{isLocked ? `Until ${lockUntil}` : 'Unlocked'}</Text>
            </View>
          </View>
        </Card>

        <Button
          variant="primary"
          fullWidth
          onPress={onSubmit}
          loading={isCreating}
          style={{ marginTop: spacing[6] }}
        >
          Create Vault
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── CreateVaultScreen ───────────────────────────────────────────────────────
export default function CreateVaultScreen() {
  const router = useRouter()
  const { COLORS } = useTheme()
  const { wallet, allWallets } = useWallet()
  const { createVault, isCreating } = useSavings()

  const [selectedWalletId, setSelectedWalletId] = React.useState('')

  React.useEffect(() => {
    if (!selectedWalletId && wallet?.id) {
      setSelectedWalletId(wallet.id)
    }
  }, [wallet?.id, selectedWalletId])

  const selectedWallet = allWallets.find(w => w.id === selectedWalletId) || wallet
  const selectedCurrency = selectedWallet?.currency ?? 'RWF'

  const [step, setStep] = useState(0)
  const [emoji, setEmoji] = useState('💰')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [targetDate, setTargetDate] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [lockUntil, setLockUntil] = useState('')
  const { width, height } = Dimensions.get('window') // add height here

  const translateX = useSharedValue(0)

  function slideForward() {
    translateX.value = withTiming(-width * step - width, { duration: 280, easing: Easing.out(Easing.quad) })
  }

  function slideBack() {
    translateX.value = withTiming(-width * (step - 1), { duration: 280, easing: Easing.out(Easing.quad) })
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  function goNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    slideForward()
    setStep((s) => s + 1)
  }

  function goBack() {
    if (step === 0) { router.back(); return }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    slideBack()
    setStep((s) => s - 1)
  }

  async function handleSubmit() {
    if (!selectedWallet) return
    try {
      const vault = await createVault({
        walletId: selectedWallet.id,
        name: name.trim(),
        description: description.trim() || undefined,
        targetAmount: parseFloat(amount) || 0,
        currency: selectedWallet.currency,
        isLocked: false,   // Note: backend create schema doesn't support isLocked yet
        targetDate: targetDate ?? undefined,
        iconEmoji: emoji,
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.replace(`/(app)/savings/${vault.id}` as never)
    } catch { }
  }

  return (
    <View style={[styles.screen, { backgroundColor: COLORS.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.background.primary }]}>
        <TouchableOpacity onPress={goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M19 12H5M12 19l-7-7 7-7" stroke={COLORS.accent.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text variant="h3" style={{ color: COLORS.text.primary }}>New Vault</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Step Indicator */}
      <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[4] }}>
        <StepIndicator steps={STEP_LABELS} currentStep={step} />
      </View>

      {/* Slides container */}
      <View style={styles.slidesContainer}>
        <Animated.View style={
          [
            {
              flexDirection: 'row',
              width: width * 5,
              height: '100%'
            },
            animatedStyle
          ]
        }>
          <View style={{ width, height: '100%' }}>
            <NameStep
              emoji={emoji} name={name} description={description}
              onEmojiChange={setEmoji} onNameChange={setName} onDescriptionChange={setDescription}
              onNext={goNext}
            />
          </View>
          <View style={{ width, height: '100%' }}>
            <WalletStep
              selectedWalletId={selectedWalletId}
              allWallets={allWallets}
              onSelect={setSelectedWalletId}
              onNext={goNext}
            />
          </View>
          <View style={{ width, height: '100%' }}>
            <TargetStep
              amount={amount} currency={selectedCurrency}
              onAmountChange={setAmount} onNext={goNext}
            />
          </View>
          <View style={{ width, height: '100%' }}>
            <DateStep
              targetDate={targetDate} onDateChange={setTargetDate}
              targetAmount={parseFloat(amount) || 0} currency={selectedCurrency}
              onNext={goNext}
            />
          </View>
          <View style={{ width, height: '100%' }}>
            <LockStep
              name={name} emoji={emoji} targetAmount={parseFloat(amount) || 0}
              targetDate={targetDate} currency={selectedCurrency}
              isLocked={isLocked} lockUntil={lockUntil}
              onLockChange={setIsLocked} onLockUntilChange={setLockUntil}
              onSubmit={handleSubmit} isCreating={isCreating}
            />
          </View>
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
  },
  slidesContainer: { flex: 1, overflow: 'hidden' },
  step: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  emojiCell: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
  },
  nextBtnContainer: {
    position: 'absolute',
    bottom: spacing[8],
    left: spacing[4],
    right: spacing[4],
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
})
