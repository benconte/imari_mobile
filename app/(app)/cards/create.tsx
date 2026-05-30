import React, { useState, useEffect } from 'react'
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
import Svg, { Path } from 'react-native-svg'

import { useTheme } from '../../../src/hooks/useTheme'
import { useVirtualCards } from '../../../src/hooks/useVirtualCards'
import { useWallet } from '../../../src/hooks/useWallet'
import { Text } from '../../../src/components/ui/Text'
import { Button } from '../../../src/components/ui/Button'
import { StepIndicator } from '../../../src/components/ui/StepIndicator'
import { AmountInput } from '../../../src/components/ui/AmountInput'
import { Switch } from '../../../src/components/ui/Switch'
import { VirtualCardDisplay } from '../../../src/components/cards/VirtualCardDisplay'
import { formatCurrency } from '../../../src/lib/utils/currency'

const { width } = Dimensions.get('window')
const STEP_LABELS = ['Wallet', 'Settings', 'Review']

// ─── Step 0: Wallet ──────────────────────────────────────────────────────────
function WalletStep({
  selectedWalletId, allWallets, onSelect, onNext
}: {
  selectedWalletId: string
  allWallets: any[]
  onSelect: (id: string) => void
  onNext: () => void
}) {
  const { COLORS, spacing, radius } = useTheme()
  return (
    <View style={[styles.step, { paddingHorizontal: spacing[4], paddingBottom: spacing[8] }]}>
      <Text variant="h2" style={{ color: COLORS.text.primary, marginBottom: spacing[2] }}>
        Select a wallet
      </Text>
      <Text variant="body" style={{ color: COLORS.text.secondary, marginBottom: spacing[5] }}>
        Choose which wallet will fund this card.
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

// ─── Step 1: Settings ────────────────────────────────────────────────────────
function SettingsStep({
  limit, onLimitChange, currency, allowOnline, onAllowOnlineChange, onNext,
}: {
  limit: string
  onLimitChange: (l: string) => void
  currency: string
  allowOnline: boolean
  onAllowOnlineChange: (v: boolean) => void
  onNext: () => void
}) {
  const { COLORS, spacing, radius } = useTheme()
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.step, { paddingHorizontal: spacing[4], paddingBottom: spacing[8] }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing[8] }}>
        <Text variant="h2" style={{ color: COLORS.text.primary, marginBottom: spacing[2] }}>
          Card Settings
        </Text>
        <Text variant="body" style={{ color: COLORS.text.secondary, marginBottom: spacing[5] }}>
          Set limits and permissions for your new card.
        </Text>

        <View style={{ marginBottom: spacing[6] }}>
          <AmountInput 
            value={limit} 
            onChange={onLimitChange} 
            currency={currency} 
            label="Monthly Spending Limit (Optional)" 
          />
          <Text variant="caption" style={{ color: COLORS.text.secondary, marginTop: spacing[2], textAlign: 'center' }}>
            Leave empty for no limit
          </Text>
        </View>

        <View style={[styles.settingRow, { backgroundColor: COLORS.background.secondary, padding: spacing[4], borderRadius: radius.lg }]}>
          <View style={{ flex: 1 }}>
            <Text variant="body" style={{ color: COLORS.text.primary }}>Allow Online Payments</Text>
            <Text variant="caption" style={{ color: COLORS.text.secondary }}>Enable for web and in-app purchases</Text>
          </View>
          <Switch value={allowOnline} onChange={onAllowOnlineChange} />
        </View>

        <Button
          variant="primary"
          fullWidth
          onPress={onNext}
          style={{ marginTop: spacing[6] }}
        >
          Continue
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── Step 2: Review ──────────────────────────────────────────────────────────
function ReviewStep({
  walletId, limit, allowOnline, currency, onSubmit, isCreating
}: {
  walletId: string
  limit: string
  allowOnline: boolean
  currency: string
  onSubmit: () => void
  isCreating: boolean
}) {
  const { COLORS, spacing } = useTheme()
  return (
    <View style={[styles.step, { paddingHorizontal: spacing[4], paddingBottom: spacing[8] }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing[8] }}>
        <Text variant="h2" style={{ color: COLORS.text.primary, marginBottom: spacing[6] }}>
          Preview Card
        </Text>
        
        <View style={{ alignItems: 'center', marginBottom: spacing[8] }}>
          <VirtualCardDisplay 
            card={{
              id: 'preview',
              walletId,
              maskedNumber: '**** **** **** 0000',
              expiryMonth: new Date().getMonth() + 4,
              expiryYear: parseInt(new Date().getFullYear().toString().slice(-2)),
              cardHolder: 'JOHN DOE',
              type: 'VIRTUAL_ONLY',
              status: 'ACTIVE',
              spendingLimit: limit ? parseFloat(limit) : null,
              spentToday: 0,
              currency,
              allowOnline,
              merchantLocks: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }} 
            size="full" 
          />
        </View>
        
        <Text variant="body" style={{ color: COLORS.text.secondary, textAlign: 'center' }}>
          This virtual card will be generated instantly and ready for use.
        </Text>

        <Button 
          variant="primary"
          fullWidth
          onPress={onSubmit} 
          loading={isCreating}
          style={{ marginTop: spacing[6] }}
        >
          Create Card
        </Button>
      </ScrollView>
    </View>
  )
}

// ─── CreateCardScreen ───────────────────────────────────────────────────────
export default function CreateCardScreen() {
  const router = useRouter()
  const { COLORS, spacing } = useTheme()
  const { wallet, allWallets } = useWallet()
  const { createCard, isCreating } = useVirtualCards()

  const [selectedWalletId, setSelectedWalletId] = useState('')
  const [step, setStep] = useState(0)
  const [limit, setLimit] = useState('')
  const [allowOnline, setAllowOnline] = useState(true)

  useEffect(() => {
    if (!selectedWalletId && wallet?.id) {
      setSelectedWalletId(wallet.id)
    }
  }, [wallet?.id, selectedWalletId])

  const selectedWallet = allWallets.find(w => w.id === selectedWalletId) || wallet
  const selectedCurrency = selectedWallet?.currency ?? 'RWF'

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

  const handleSubmit = async () => {
    if (!selectedWallet) return
    try {
      await createCard({
        walletId: selectedWallet.id,
        spendingLimit: limit ? parseFloat(limit) : undefined,
        allowOnline,
        currency: selectedCurrency,
        type: 'MULTI_USE',
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.replace('/(app)/(tabs)/cards')
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: COLORS.background.primary }]}>
      <View style={[styles.header, { backgroundColor: COLORS.background.primary, paddingHorizontal: spacing[4], paddingTop: spacing[12], paddingBottom: spacing[4] }]}>
        <TouchableOpacity onPress={goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M19 12H5M12 19l-7-7 7-7" stroke={COLORS.accent.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text variant="h3" style={{ color: COLORS.text.primary }}>New Card</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[4] }}>
        <StepIndicator steps={STEP_LABELS} currentStep={step} />
      </View>

      <View style={styles.slidesContainer}>
        <Animated.View style={[
          {
            flexDirection: 'row',
            width: width * 3,
            height: '100%'
          },
          animatedStyle
        ]}>
          <View style={{ width, height: '100%' }}>
            <WalletStep
              selectedWalletId={selectedWalletId}
              allWallets={allWallets}
              onSelect={setSelectedWalletId}
              onNext={goNext}
            />
          </View>
          <View style={{ width, height: '100%' }}>
            <SettingsStep
              limit={limit}
              onLimitChange={setLimit}
              currency={selectedCurrency}
              allowOnline={allowOnline}
              onAllowOnlineChange={setAllowOnline}
              onNext={goNext}
            />
          </View>
          <View style={{ width, height: '100%' }}>
            <ReviewStep
              walletId={selectedWalletId}
              limit={limit}
              allowOnline={allowOnline}
              currency={selectedCurrency}
              onSubmit={handleSubmit}
              isCreating={isCreating}
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
  },
  slidesContainer: { flex: 1, overflow: 'hidden' },
  step: { flex: 1 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
})
