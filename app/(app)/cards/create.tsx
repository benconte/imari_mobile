import React, { useState } from 'react'
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Screen } from '../../../src/components/layout/Screen'
import { Text } from '../../../src/components/ui/Text'
import { Button } from '../../../src/components/ui/Button'
import { Chip } from '../../../src/components/ui/Chip'
import { StepIndicator } from '../../../src/components/ui/StepIndicator'
import { AmountInput } from '../../../src/components/ui/AmountInput'
import { Switch } from '../../../src/components/ui/Switch'
import { VirtualCardDisplay } from '../../../src/components/cards/VirtualCardDisplay'
import { useVirtualCards } from '../../../src/hooks/useVirtualCards'
import { useTheme } from '../../../src/hooks/useTheme'

const STEPS = ['Details', 'Preview']

export default function CreateCardScreen() {
  const router = useRouter()
  const { COLORS, spacing, radius } = useTheme()
  const { createCard, isCreating } = useVirtualCards()

  const [step, setStep] = useState(0)
  const [walletId, setWalletId] = useState('w-1')
  const [limit, setLimit] = useState('')
  const [allowOnline, setAllowOnline] = useState(true)

  const handleNext = () => setStep(1)
  const handleBack = () => setStep(0)

  const handleSubmit = async () => {
    try {
      await createCard({
        walletId,
        spendingLimit: limit ? parseFloat(limit) : undefined,
        allowOnline,
      })
      router.replace('/(app)/(tabs)/cards')
    } catch (error) {
      console.error(error)
    }
  }

  const renderStep0 = () => (
    <ScrollView style={styles.stepContent} contentContainerStyle={{ paddingBottom: spacing[8] }} showsVerticalScrollIndicator={false}>
      <Text variant="h3" color={COLORS.text.primary} style={{ marginBottom: spacing[6] }}>Card Details</Text>
      
      <View style={{ marginBottom: spacing[6], gap: spacing[4] }}>
        <Text variant="label" color={COLORS.text.secondary}>Select Funding Wallet</Text>
        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
          <Chip label="Main Wallet (RWF)" active={walletId === 'w-1'} onPress={() => setWalletId('w-1')} />
          <Chip label="USD Wallet" active={walletId === 'w-2'} onPress={() => setWalletId('w-2')} />
        </View>
      </View>

      <View style={{ marginBottom: spacing[6] }}>
        <AmountInput 
          value={limit} 
          onChange={setLimit} 
          currency="RWF" 
          label="Monthly Spending Limit (Optional)" 
        />
        <Text variant="caption" color={COLORS.text.secondary} style={{ marginTop: spacing[2], textAlign: 'center' }}>
          Leave empty for no limit
        </Text>
      </View>

      <View style={[styles.settingRow, { backgroundColor: COLORS.background.secondary, padding: spacing[4], borderRadius: radius.lg }]}>
        <View style={{ flex: 1 }}>
          <Text variant="body" color={COLORS.text.primary}>Allow Online Payments</Text>
          <Text variant="caption" color={COLORS.text.secondary}>Enable for web and in-app purchases</Text>
        </View>
        <Switch value={allowOnline} onChange={setAllowOnline} />
      </View>
    </ScrollView>
  )

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text variant="h3" color={COLORS.text.primary} style={{ marginBottom: spacing[6] }}>Preview Card</Text>
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
            currency: walletId === 'w-1' ? 'RWF' : 'USD',
            allowOnline,
            merchantLocks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }} 
          size="full" 
        />
      </View>
      <Text variant="body" color={COLORS.text.secondary} style={{ textAlign: 'center' }}>
        This virtual card will be generated instantly and ready for use.
      </Text>
    </View>
  )

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Screen scrollable={false} style={{ paddingHorizontal: spacing[6], paddingTop: spacing[4] }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={step === 0 ? () => router.back() : handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1, paddingRight: 24 }}>
            <StepIndicator steps={STEPS} currentStep={step} />
          </View>
        </View>

        <View style={{ flex: 1, marginTop: spacing[8] }}>
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
        </View>

        <View style={{ paddingVertical: spacing[4] }}>
          <Button 
            onPress={step === 1 ? handleSubmit : handleNext} 
            loading={isCreating}
            disabled={!walletId}
          >
            {step === 1 ? 'Create Card' : 'Continue'}
          </Button>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 4, marginLeft: -4 },
  stepContent: { flex: 1 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
})
