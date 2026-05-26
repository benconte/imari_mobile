/**
 * Confirm screen — Steps 2 & 3 of transfer flow.
 * State: 'amount' → 'pin' → 'success'
 * Calls POST /wallet/transfer (real backend).
 */

import React, { useState, useCallback, useEffect } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useTheme } from '../../../src/hooks/useTheme'
import { useWallet } from '../../../src/hooks/useWallet'
import { useTransfer } from '../../../src/hooks/useTransfer'
import { Text } from '../../../src/components/ui/Text'
import { AmountStep } from '../../../src/components/transfer/AmountStep'
import { PinStep } from '../../../src/components/transfer/PinStep'
import { SuccessScreen } from '../../../src/components/transfer/SuccessScreen'

type Step = 'amount' | 'pin' | 'success'

export default function ConfirmScreen() {
  const { COLORS, spacing } = useTheme()
  const { walletNumber } = useLocalSearchParams<{ walletNumber: string }>()

  const { wallet } = useWallet()
  const transfer = useTransfer()

  const [step, setStep] = useState<Step>('amount')
  const [pendingAmount, setPendingAmount] = useState('')
  const [pendingDescription, setPendingDescription] = useState('')

  // Auto-resolve recipient name on mount
  useEffect(() => {
    if (walletNumber) transfer.resolveRecipient(walletNumber)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Slide animation between amount and pin steps
  const translateX = useSharedValue(0)

  const amountStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }))
  const pinStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value + 400 }],
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }))

  function slideToPin() {
    translateX.value = withTiming(-400, { duration: 280, easing: Easing.out(Easing.quad) })
    setStep('pin')
  }

  function slideToAmount() {
    translateX.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.quad) })
    setStep('amount')
  }

  const handleAmountContinue = useCallback((amount: string, description: string) => {
    setPendingAmount(amount)
    setPendingDescription(description)
    slideToPin()
  }, [])

  const handlePinComplete = useCallback(
    async (pin: string) => {
      if (!wallet) return
      try {
        await transfer.initiate({
          receiverWalletNumber: walletNumber ?? '',
          amount: pendingAmount,
          currency: wallet.currency,
          description: pendingDescription || undefined,
          pin,
        })
        setStep('success')
      } catch {
        // error is set in useTransfer, PinStep will show shake
      }
    },
    [wallet, walletNumber, pendingAmount, pendingDescription, transfer],
  )

  const handleDone = useCallback(() => {
    router.replace('/(app)/(tabs)/home')
  }, [])

  // Back navigation per step
  const handleBack = useCallback(() => {
    if (step === 'amount') {
      router.back()
    } else if (step === 'pin') {
      slideToAmount()
      transfer.reset()
    }
  }, [step, transfer])

  if (step === 'success' && transfer.result) {
    return (
      <SuccessScreen
        result={transfer.result}
        recipientName={transfer.resolvedRecipient?.name ?? walletNumber ?? ''}
        onDone={handleDone}
      />
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background.primary }]}>
      {/* Back button */}
      {step !== 'success' && (
        <Pressable
          onPress={handleBack}
          style={[styles.backBtn, { paddingTop: spacing[4], paddingHorizontal: spacing[4] }]}
        >
          <Text variant="body" style={{ color: COLORS.accent.primary }}>
            ← Back
          </Text>
        </Pressable>
      )}

      {/* Slide container */}
      <View style={styles.slides}>
        {/* Amount step */}
        <Animated.View style={amountStyle}>
          <AmountStep
            walletNumber={walletNumber ?? ''}
            resolvedRecipient={transfer.resolvedRecipient}
            isResolving={transfer.isResolving}
            currency={wallet?.currency ?? 'RWF'}
            balance={wallet ? Number(wallet.balance) : undefined}
            onContinue={handleAmountContinue}
          />
        </Animated.View>

        {/* PIN step */}
        <Animated.View style={pinStyle}>
          <PinStep
            amount={pendingAmount}
            currency={wallet?.currency ?? 'RWF'}
            recipientName={transfer.resolvedRecipient?.name ?? walletNumber ?? ''}
            isLoading={transfer.isLoading}
            error={transfer.error}
            onComplete={handlePinComplete}
          />
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { zIndex: 10 },
  slides: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
})
