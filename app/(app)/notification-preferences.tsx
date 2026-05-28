import React, { useState, useEffect } from 'react'
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Screen } from '../../src/components/layout/Screen'
import { Text } from '../../src/components/ui/Text'
import { Switch } from '../../src/components/ui/Switch'
import { Button } from '../../src/components/ui/Button'
import { Input } from '../../src/components/ui/Input'
import { useNotificationPreferences } from '../../src/hooks/useNotifications'
import { useUIStore } from '../../src/stores/ui.store'
import { useTheme } from '../../src/hooks/useTheme'
import { NotificationChannel, NotificationType } from '../../src/types/notification.types'

const CHANNELS: { id: NotificationChannel; label: string; desc: string; icon: any }[] = [
  { id: 'PUSH', label: 'Push Notifications', desc: 'Instant alerts on your device', icon: 'smartphone' },
  { id: 'SMS', label: 'SMS', desc: 'Text messages for critical alerts', icon: 'sms' },
  { id: 'EMAIL', label: 'Email', desc: 'Summaries and receipts', icon: 'email' },
  { id: 'IN_APP', label: 'In-App', desc: 'Notifications while using Imari', icon: 'notifications' },
]

const TYPES: { id: NotificationType; label: string; locked?: boolean }[] = [
  { id: 'SECURITY_WARNING', label: 'Security Warnings', locked: true },
  { id: 'TRANSACTION_ALERT', label: 'Transaction Alerts' },
  { id: 'SAVINGS_UPDATE', label: 'Savings Updates' },
  { id: 'BUDGET_ALERT', label: 'Budget Alerts' },
  { id: 'PAYMENT_CONFIRMATION', label: 'Payment Confirmations' },
  { id: 'PROMOTIONAL', label: 'Promotions & Offers' },
  { id: 'FINANCIAL_INSIGHT', label: 'Financial Insights' },
  { id: 'SUBSCRIPTION_REMINDER', label: 'Subscription Reminders' },
]

export default function NotificationPreferencesScreen() {
  const router = useRouter()
  const { COLORS, spacing, radius } = useTheme()
  const { preferences, isLoading, update, isUpdating } = useNotificationPreferences()
  const { showToast } = useUIStore()

  const [channels, setChannels] = useState<NotificationChannel[]>([])
  const [types, setTypes] = useState<NotificationType[]>([])
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false)
  const [quietFrom, setQuietFrom] = useState('')
  const [quietTo, setQuietTo] = useState('')

  useEffect(() => {
    if (preferences) {
      setChannels(preferences.channels)
      setTypes(preferences.types)
      setQuietHoursEnabled(!!(preferences.quietFrom && preferences.quietTo))
      setQuietFrom(preferences.quietFrom || '')
      setQuietTo(preferences.quietTo || '')
    }
  }, [preferences])

  const toggleChannel = (channel: NotificationChannel, enabled: boolean) => {
    if (!enabled && channels.length === 1) {
      showToast({ message: 'At least one delivery channel must be enabled', variant: 'error' })
      return
    }
    setChannels(prev => enabled ? [...prev, channel] : prev.filter(c => c !== channel))
  }

  const toggleType = (type: NotificationType, enabled: boolean) => {
    if (type === 'SECURITY_WARNING') return // Always on
    setTypes(prev => enabled ? [...prev, type] : prev.filter(t => t !== type))
  }

  const handleSave = async () => {
    // Basic time validation
    if (quietHoursEnabled) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(quietFrom) || !timeRegex.test(quietTo)) {
        showToast({ message: 'Please enter quiet hours in HH:MM format', variant: 'error' })
        return
      }
    }

    await update({
      channels,
      types,
      quietFrom: quietHoursEnabled ? quietFrom : null,
      quietTo: quietHoursEnabled ? quietTo : null,
    })
    showToast({ message: 'Preferences saved successfully', variant: 'success' })
    router.back()
  }

  if (isLoading) return <Screen scrollable={false}><View /></Screen>

  return (
    <Screen scrollable={true} contentContainerStyle={{ paddingBottom: spacing[8] }}>
      <View style={[styles.header, { paddingHorizontal: spacing[6], paddingTop: spacing[4], marginBottom: spacing[6] }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text variant="h2" color={COLORS.text.primary}>Notification Settings</Text>
      </View>

      <View style={{ paddingHorizontal: spacing[6], gap: spacing[8] }}>
        
        {/* CHANNELS SECTION */}
        <View style={{ gap: spacing[4] }}>
          <Text variant="h3" color={COLORS.text.primary}>Delivery Channels</Text>
          <View style={{ backgroundColor: COLORS.background.secondary, borderRadius: radius.lg, overflow: 'hidden' }}>
            {CHANNELS.map((ch, idx) => {
              const isActive = channels.includes(ch.id)
              return (
                <View key={ch.id}>
                  <View style={[styles.row, { padding: spacing[4] }]}>
                    <View style={[styles.iconContainer, { backgroundColor: COLORS.background.tertiary }]}>
                      <MaterialIcons name={ch.icon as any} size={20} color={COLORS.text.primary} />
                    </View>
                    <View style={{ flex: 1, marginRight: spacing[4] }}>
                      <Text variant="body" color={COLORS.text.primary}>{ch.label}</Text>
                      <Text variant="caption" color={COLORS.text.tertiary}>{ch.desc}</Text>
                    </View>
                    <Switch value={isActive} onChange={(val) => toggleChannel(ch.id, val)} />
                  </View>
                  {idx < CHANNELS.length - 1 && <View style={{ height: 1, backgroundColor: COLORS.border.default, marginLeft: 56 }} />}
                </View>
              )
            })}
          </View>
        </View>

        {/* TYPES SECTION */}
        <View style={{ gap: spacing[4] }}>
          <Text variant="h3" color={COLORS.text.primary}>Alert Types</Text>
          <View style={{ backgroundColor: COLORS.background.secondary, borderRadius: radius.lg, overflow: 'hidden' }}>
            {TYPES.map((t, idx) => {
              const isActive = types.includes(t.id) || t.locked
              return (
                <View key={t.id}>
                  <View style={[styles.row, { padding: spacing[4] }]}>
                    <View style={{ flex: 1, marginRight: spacing[4] }}>
                      <Text variant="body" color={t.locked ? COLORS.text.secondary : COLORS.text.primary}>{t.label}</Text>
                      {t.locked && <Text variant="caption" color={COLORS.text.tertiary}>Security alerts cannot be disabled</Text>}
                    </View>
                    <Switch value={!!isActive} onChange={(val) => toggleType(t.id, val)} disabled={t.locked} />
                  </View>
                  {idx < TYPES.length - 1 && <View style={{ height: 1, backgroundColor: COLORS.border.default, marginLeft: spacing[4] }} />}
                </View>
              )
            })}
          </View>
        </View>

        {/* QUIET HOURS SECTION */}
        <View style={{ gap: spacing[4] }}>
          <Text variant="h3" color={COLORS.text.primary}>Quiet Hours</Text>
          <View style={{ backgroundColor: COLORS.background.secondary, borderRadius: radius.lg, padding: spacing[4] }}>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: spacing[4] }}>
                <Text variant="body" color={COLORS.text.primary}>Enable quiet hours</Text>
                <Text variant="caption" color={COLORS.text.tertiary} style={{ marginTop: 2 }}>
                  During quiet hours, only security alerts will be delivered
                </Text>
              </View>
              <Switch value={quietHoursEnabled} onChange={setQuietHoursEnabled} />
            </View>
            
            {quietHoursEnabled && (
              <View style={{ flexDirection: 'row', gap: spacing[4], marginTop: spacing[4] }}>
                <View style={{ flex: 1 }}>
                  <Input label="From (HH:MM)" value={quietFrom} onChangeText={setQuietFrom} placeholder="22:00" keyboardType="numbers-and-punctuation" />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label="To (HH:MM)" value={quietTo} onChangeText={setQuietTo} placeholder="07:00" keyboardType="numbers-and-punctuation" />
                </View>
              </View>
            )}
          </View>
        </View>

        <Button onPress={handleSave} loading={isUpdating} fullWidth>Save Changes</Button>

      </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  }
})
