/**
 * Notification Preferences Screen
 *
 * Backend model uses `mutedTypes[]` (inverted) — a type is ENABLED when
 * it is NOT in mutedTypes. SECURITY_WARNING is never added to mutedTypes.
 *
 * Channels: IN_APP | PUSH | EMAIL (no SMS — backend doesn't support it)
 * PUT /notifications/preferences (not PATCH)
 */

import React, { useState, useEffect } from 'react'
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Screen } from '../../src/components/layout/Screen'
import { Text } from '../../src/components/ui/Text'
import { Switch } from '../../src/components/ui/Switch'
import { Button } from '../../src/components/ui/Button'
import { Input } from '../../src/components/ui/Input'
import { useNotificationPreferences } from '../../src/hooks/useNotifications'
import { useUIStore } from '../../src/stores/ui.store'
import { useTheme } from '../../src/hooks/useTheme'
import { NotificationChannel, NotificationType } from '../../src/types/notification.types'

const CHANNELS: { id: NotificationChannel; label: string; desc: string; icon: string }[] = [
  { id: 'PUSH', label: 'Push Notifications', desc: 'Instant alerts on your device', icon: 'smartphone' },
  { id: 'EMAIL', label: 'Email', desc: 'Summaries and receipts', icon: 'email' },
  { id: 'IN_APP', label: 'In-App', desc: 'Notifications while using Imari', icon: 'notifications' },
]

// All available types with their display labels
// SECURITY_WARNING is locked — always enabled, never muted
const TYPES: { id: NotificationType; label: string; locked?: boolean }[] = [
  { id: 'SECURITY_WARNING', label: 'Security Warnings', locked: true },
  { id: 'TRANSACTION_ALERT', label: 'Transaction Alerts' },
  { id: 'PAYMENT_CONFIRMATION', label: 'Payment Confirmations' },
  { id: 'SAVINGS_UPDATE', label: 'Savings Updates' },
  { id: 'BUDGET_ALERT', label: 'Budget Alerts' },
  { id: 'SUBSCRIPTION_REMINDER', label: 'Subscription Reminders' },
  { id: 'FINANCIAL_INSIGHT', label: 'Financial Insights' },
  { id: 'CARD_ALERT', label: 'Card Alerts' },
  { id: 'KYC_UPDATE', label: 'Identity Verification Updates' },
  { id: 'PROMOTIONAL', label: 'Promotions & Offers' },
]

const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/

export default function NotificationPreferencesScreen() {
  const router = useRouter()
  const { COLORS, spacing, radius } = useTheme()
  const { preferences, isLoading, update, isUpdating } = useNotificationPreferences()
  const showToast = useUIStore(s => s.showToast)

  const [channels, setChannels] = useState<NotificationChannel[]>(['IN_APP', 'PUSH'])
  // mutedTypes: types in this array are DISABLED. Empty = all enabled.
  const [mutedTypes, setMutedTypes] = useState<NotificationType[]>([])
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false)
  const [quietFrom, setQuietFrom] = useState('')
  const [quietTo, setQuietTo] = useState('')
  const [timezone, setTimezone] = useState('Africa/Kigali')
  const [emailDigest, setEmailDigest] = useState(false)

  useEffect(() => {
    if (!preferences) return
    setChannels(preferences.channels)
    setMutedTypes(preferences.mutedTypes)
    setQuietHoursEnabled(!!(preferences.quietFrom && preferences.quietTo))
    setQuietFrom(preferences.quietFrom ?? '')
    setQuietTo(preferences.quietTo ?? '')
    setTimezone(preferences.timezone ?? 'Africa/Kigali')
    setEmailDigest(preferences.emailDigest ?? false)
  }, [preferences])

  // A channel is active when it is in the channels array
  const isChannelActive = (ch: NotificationChannel) => channels.includes(ch)

  // A type is active (enabled) when it is NOT in mutedTypes
  const isTypeActive = (type: NotificationType) => !mutedTypes.includes(type)

  const toggleChannel = (channel: NotificationChannel, enabled: boolean) => {
    if (!enabled && channels.length === 1) {
      showToast({ message: 'At least one delivery channel must be enabled', variant: 'error' })
      return
    }
    setChannels(prev => enabled ? [...prev, channel] : prev.filter(c => c !== channel))
  }

  const toggleType = (type: NotificationType, enabled: boolean) => {
    if (type === 'SECURITY_WARNING') return // Always enabled — never mutable
    if (enabled) {
      // Remove from mutedTypes (type becomes enabled)
      setMutedTypes(prev => prev.filter(t => t !== type))
    } else {
      // Add to mutedTypes (type becomes disabled)
      setMutedTypes(prev => [...prev, type])
    }
  }

  const handleSave = async () => {
    if (quietHoursEnabled) {
      if (!TIME_REGEX.test(quietFrom) || !TIME_REGEX.test(quietTo)) {
        showToast({ message: 'Quiet hours must be in HH:MM format (e.g. 22:00)', variant: 'error' })
        return
      }
    }

    try {
      await update({
        channels,
        mutedTypes,
        quietFrom: quietHoursEnabled ? quietFrom : null,
        quietTo: quietHoursEnabled ? quietTo : null,
        timezone,
        emailDigest,
      })
      showToast({ message: 'Preferences saved successfully', variant: 'success' })
      router.back()
    } catch {
      showToast({ message: 'Failed to save preferences. Please try again.', variant: 'error' })
    }
  }

  if (isLoading) {
    return (
      <Screen scrollable={false}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text variant="body" color={COLORS.text.secondary}>Loading preferences…</Text>
        </View>
      </Screen>
    )
  }

  return (
    <Screen scrollable={true} contentContainerStyle={{ paddingBottom: spacing[8] }}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing[6], paddingTop: spacing[4], marginBottom: spacing[6] }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text variant="h2" color={COLORS.text.primary}>Notification Settings</Text>
      </View>

      <View style={{ paddingHorizontal: spacing[6], gap: spacing[8] }}>

        {/* DELIVERY CHANNELS */}
        <View style={{ gap: spacing[3] }}>
          <Text variant="h3" color={COLORS.text.primary}>Delivery Channels</Text>
          <Text variant="caption" color={COLORS.text.tertiary}>
            Choose how you receive notifications
          </Text>
          <View style={{ backgroundColor: COLORS.background.secondary, borderRadius: radius.lg, overflow: 'hidden' }}>
            {CHANNELS.map((ch, idx) => (
              <View key={ch.id}>
                <View style={[styles.row, { padding: spacing[4] }]}>
                  <View style={[styles.iconContainer, { backgroundColor: COLORS.background.tertiary }]}>
                    <MaterialIcons name={ch.icon as any} size={20} color={COLORS.text.primary} />
                  </View>
                  <View style={{ flex: 1, marginRight: spacing[4] }}>
                    <Text variant="body" color={COLORS.text.primary}>{ch.label}</Text>
                    <Text variant="caption" color={COLORS.text.tertiary}>{ch.desc}</Text>
                  </View>
                  <Switch
                    value={isChannelActive(ch.id)}
                    onChange={(val) => toggleChannel(ch.id, val)}
                  />
                </View>
                {/* Email digest sub-option */}
                {ch.id === 'EMAIL' && isChannelActive('EMAIL') && (
                  <View style={[styles.row, { paddingHorizontal: spacing[4], paddingBottom: spacing[3], marginLeft: 52 }]}>
                    <View style={{ flex: 1, marginRight: spacing[4] }}>
                      <Text variant="caption" color={COLORS.text.secondary}>Email digest mode</Text>
                      <Text variant="caption" color={COLORS.text.tertiary}>
                        Batch low-priority emails instead of individual alerts
                      </Text>
                    </View>
                    <Switch value={emailDigest} onChange={setEmailDigest} />
                  </View>
                )}
                {idx < CHANNELS.length - 1 && (
                  <View style={{ height: 1, backgroundColor: COLORS.border.default, marginLeft: 56 }} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* ALERT TYPES */}
        <View style={{ gap: spacing[3] }}>
          <Text variant="h3" color={COLORS.text.primary}>Alert Types</Text>
          <Text variant="caption" color={COLORS.text.tertiary}>
            Control which events trigger notifications
          </Text>
          <View style={{ backgroundColor: COLORS.background.secondary, borderRadius: radius.lg, overflow: 'hidden' }}>
            {TYPES.map((t, idx) => (
              <View key={t.id}>
                <View style={[styles.row, { padding: spacing[4] }]}>
                  <View style={{ flex: 1, marginRight: spacing[4] }}>
                    <Text variant="body" color={t.locked ? COLORS.text.secondary : COLORS.text.primary}>
                      {t.label}
                    </Text>
                    {t.locked && (
                      <Text variant="caption" color={COLORS.text.tertiary}>
                        Security alerts cannot be disabled
                      </Text>
                    )}
                  </View>
                  <Switch
                    value={isTypeActive(t.id)}
                    onChange={(val) => toggleType(t.id, val)}
                    disabled={t.locked}
                  />
                </View>
                {idx < TYPES.length - 1 && (
                  <View style={{ height: 1, backgroundColor: COLORS.border.default, marginLeft: spacing[4] }} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* QUIET HOURS */}
        <View style={{ gap: spacing[3] }}>
          <Text variant="h3" color={COLORS.text.primary}>Quiet Hours</Text>
          <View style={{ backgroundColor: COLORS.background.secondary, borderRadius: radius.lg, padding: spacing[4], gap: spacing[4] }}>
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
              <>
                <View style={{ flexDirection: 'row', gap: spacing[4] }}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="From (HH:MM)"
                      value={quietFrom}
                      onChangeText={setQuietFrom}
                      placeholder="22:00"
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="To (HH:MM)"
                      value={quietTo}
                      onChangeText={setQuietTo}
                      placeholder="07:00"
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                </View>
                <Input
                  label="Timezone"
                  value={timezone}
                  onChangeText={setTimezone}
                  placeholder="Africa/Kigali"
                  autoCapitalize="none"
                />
              </>
            )}
          </View>
        </View>

        <Button onPress={handleSave} loading={isUpdating} fullWidth>
          Save Changes
        </Button>

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
  },
})
