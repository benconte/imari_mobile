import React, { useState, useEffect } from 'react'
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Screen } from '../../../src/components/layout/Screen'
import { Text } from '../../../src/components/ui/Text'
import { BottomSheet } from '../../../src/components/ui/BottomSheet'
import { PinInput } from '../../../src/components/ui/PinInput'
import { Card } from '../../../src/components/ui/Card'
import { Switch } from '../../../src/components/ui/Switch'
import { VirtualCardDisplay } from '../../../src/components/cards/VirtualCardDisplay'
import { CardActions } from '../../../src/components/cards/CardActions'
import { useCard } from '../../../src/hooks/useVirtualCards'
import { useTheme } from '../../../src/hooks/useTheme'

function RevealTimer({ active, onHide }: { active: boolean, onHide: () => void }) {
  const { COLORS, radius } = useTheme()
  const progress = useSharedValue(1)
  
  useEffect(() => {
    if (active) {
      progress.value = 1
      progress.value = withTiming(0, { duration: 30000, easing: Easing.linear })
    } else {
      progress.value = 1
    }
  }, [active, progress])

  const style = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`
  }))

  if (!active) return null

  return (
    <View style={{ marginTop: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text variant="caption" color={COLORS.status.warning}>Sensitive details revealed</Text>
        <TouchableOpacity onPress={onHide}>
          <Text variant="caption" color={COLORS.accent.primary}>Hide now</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 4, backgroundColor: COLORS.background.tertiary, borderRadius: radius.full, overflow: 'hidden' }}>
        <Animated.View style={[{ height: '100%', backgroundColor: COLORS.status.warning, borderRadius: radius.full }, style]} />
      </View>
    </View>
  )
}

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { COLORS, spacing } = useTheme()
  const { 
    card, 
    revealedCard, 
    isLoading, 
    isRevealing, 
    reveal, 
    hideDetails, 
    freeze, 
    unfreeze, 
    updateLimits, 
    deleteCard 
  } = useCard(id || '')

  const [pinSheetVisible, setPinSheetVisible] = useState(false)
  const [pinError, setPinError] = useState<string | null>(null)
  
  const [limitSheetVisible, setLimitSheetVisible] = useState(false)
  const [isOnlineEnabled, setIsOnlineEnabled] = useState(false)

  useEffect(() => {
    if (card) setIsOnlineEnabled(card.allowOnline)
  }, [card])

  if (isLoading || !card) {
    return (
      <Screen scrollable={false} style={{ paddingHorizontal: spacing[6] }}>
        <Text>Loading...</Text>
      </Screen>
    )
  }

  const isRevealed = !!revealedCard

  const handleRevealPress = () => {
    if (isRevealed) {
      hideDetails()
    } else {
      setPinSheetVisible(true)
    }
  }

  const handlePinComplete = async (pin: string) => {
    try {
      await reveal(pin)
      setPinSheetVisible(false)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (err: any) {
      setPinError('Incorrect PIN')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
  }

  const handleFreezeToggle = async () => {
    if (card.status === 'FROZEN') {
      await unfreeze()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } else {
      await freeze()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }

  const handleSetLimitPress = () => setLimitSheetVisible(true)

  const handleCopyNumber = () => {
    // normally use Clipboard.setStringAsync
    if (revealedCard) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } else {
      setPinSheetVisible(true)
    }
  }

  const toggleOnlinePayments = async () => {
    const newValue = !isOnlineEnabled
    setIsOnlineEnabled(newValue)
    await updateLimits({ allowOnline: newValue })
  }

  return (
    <Screen scrollable={true} style={{ paddingHorizontal: spacing[6], paddingTop: spacing[4] }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text variant="h2" color={COLORS.text.primary} style={{ flex: 1 }} numberOfLines={1}>
          Card Details
        </Text>
      </View>

      <View style={{ marginTop: spacing[6], alignItems: 'center' }}>
        <VirtualCardDisplay card={card} revealed={revealedCard} isRevealing={isRevealing} size="full" />
      </View>
      
      <RevealTimer active={isRevealed} onHide={hideDetails} />

      <View style={{ marginTop: spacing[8] }}>
        <CardActions 
          card={card}
          onFreeze={handleFreezeToggle}
          onUnfreeze={handleFreezeToggle}
          onReveal={handleRevealPress}
          onSetLimit={handleSetLimitPress}
          onCopyNumber={handleCopyNumber}
          isRevealed={isRevealed}
          isLoading={isRevealing}
        />
      </View>

      <View style={{ marginTop: spacing[8], marginBottom: spacing[8] }}>
        <Text variant="h3" color={COLORS.text.primary} style={{ marginBottom: spacing[4] }}>
          Security & Limits
        </Text>
        <Card variant="default" padding={4}>
          <View style={[styles.settingRow, { borderBottomColor: COLORS.border.default, borderBottomWidth: 1 }]}>
            <View>
              <Text variant="body" color={COLORS.text.primary}>Online Payments</Text>
              <Text variant="caption" color={COLORS.text.secondary}>Allow purchases on websites</Text>
            </View>
            <Switch value={isOnlineEnabled} onChange={toggleOnlinePayments} />
          </View>
          <View style={styles.settingRow}>
            <View>
              <Text variant="body" color={COLORS.text.primary}>Merchant Locks</Text>
              <Text variant="caption" color={COLORS.text.secondary}>
                {card.merchantLocks.length > 0 ? `${card.merchantLocks.length} categories restricted` : 'None active'}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.text.secondary} />
          </View>
        </Card>
      </View>

      <BottomSheet
        visible={pinSheetVisible}
        onClose={() => { setPinSheetVisible(false); setPinError(null) }}
        snapPoints={[500]}
      >
        <View style={{ paddingHorizontal: spacing[4], height: 400 }}>
          <PinInput 
            onComplete={handlePinComplete}
            error={pinError}
            onClearError={() => setPinError(null)}
            loading={isRevealing}
            title="Enter PIN to Reveal"
            subtitle="Enter your 4-digit wallet PIN"
          />
        </View>
      </BottomSheet>

      <BottomSheet
        visible={limitSheetVisible}
        onClose={() => setLimitSheetVisible(false)}
        title="Set Spending Limit"
        snapPoints={[400]}
      >
        <View style={{ paddingHorizontal: spacing[4] }}>
          <Text variant="body" color={COLORS.text.secondary}>
            Set a maximum monthly spending limit for this virtual card to control your expenses.
          </Text>
          {/* Mock input field here as AmountInput isn't fully imported yet */}
          <Text variant="h1" color={COLORS.text.primary} style={{ marginVertical: 32, textAlign: 'center' }}>
            $500.00
          </Text>
        </View>
      </BottomSheet>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  }
})
