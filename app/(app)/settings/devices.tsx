/**
 * Devices screen — lists all registered devices for this account.
 * Allows revoking non-current devices.
 * Accessible from Settings → Manage Devices.
 */

import React from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../../src/hooks/useTheme'
import { useDevices } from '../../../src/hooks/useDevices'
import { Text } from '../../../src/components/ui/Text'
import { Button } from '../../../src/components/ui/Button'
import { Screen } from '../../../src/components/layout/Screen'
import { Skeleton } from '../../../src/components/ui/Skeleton'
import type { UserDevice } from '../../../src/types/profile.types'

function deviceIcon(type: UserDevice['deviceType']): string {
  if (type === 'IOS') return '📱'
  if (type === 'ANDROID') return '📲'
  return '💻'
}

function formatLastSeen(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface DeviceCardProps {
  device: UserDevice
  onRevoke: (deviceId: string) => void
  isRevoking: boolean
}

function DeviceCard({ device, onRevoke, isRevoking }: DeviceCardProps) {
  const { COLORS, spacing, radius } = useTheme()

  const handleRevoke = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    Alert.alert(
      'Remove Device',
      `Remove "${device.deviceName}" from your account? It will need to sign in again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRevoke(device.deviceId),
        },
      ],
    )
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: COLORS.card.background,
          borderColor: device.isCurrent ? COLORS.accent.primary : COLORS.card.border,
          borderRadius: radius.xl,
          borderWidth: device.isCurrent ? 1.5 : 1,
          padding: spacing[4],
          marginBottom: spacing[3],
        },
      ]}
    >
      <View style={styles.cardRow}>
        {/* Icon */}
        <Text style={{ fontSize: 28, marginRight: spacing[3] }}>
          {deviceIcon(device.deviceType)}
        </Text>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text variant="label" color={COLORS.text.primary} style={{ flex: 1 }}>
              {device.deviceName}
            </Text>
            {device.isCurrent && (
              <View style={[styles.currentBadge, { backgroundColor: COLORS.accent.primaryMuted, borderRadius: 4 }]}>
                <Text variant="caption" color={COLORS.accent.primary} style={{ paddingHorizontal: 6, paddingVertical: 2 }}>
                  This device
                </Text>
              </View>
            )}
            {device.isTrusted && !device.isCurrent && (
              <View style={[styles.currentBadge, { backgroundColor: COLORS.status.successMuted, borderRadius: 4 }]}>
                <Text variant="caption" color={COLORS.status.success} style={{ paddingHorizontal: 6, paddingVertical: 2 }}>
                  Trusted
                </Text>
              </View>
            )}
          </View>

          <Text variant="caption" color={COLORS.text.tertiary} style={{ marginTop: 2 }}>
            {device.platform} · Last seen {formatLastSeen(device.lastSeenAt)}
          </Text>
          {device.osVersion && (
            <Text variant="caption" color={COLORS.text.tertiary}>
              OS {device.osVersion}
            </Text>
          )}
        </View>
      </View>

      {/* Revoke — only for non-current devices */}
      {!device.isCurrent && (
        <Pressable
          onPress={handleRevoke}
          disabled={isRevoking}
          style={({ pressed }) => [
            styles.revokeBtn,
            {
              marginTop: spacing[3],
              opacity: pressed || isRevoking ? 0.5 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${device.deviceName}`}
        >
          <Text variant="caption" color={COLORS.status.error}>
            Remove Device
          </Text>
        </Pressable>
      )}
    </View>
  )
}

export default function DevicesScreen() {
  const { COLORS, spacing } = useTheme()
  const { devices, isLoadingDevices, revokeDevice, isRevoking, refetchDevices } = useDevices()

  if (isLoadingDevices) {
    return (
      <Screen scrollable style={{ paddingHorizontal: spacing[6] }}>
        <View style={{ paddingTop: spacing[6], gap: spacing[3] }}>
          {[1, 2].map((i) => (
            <Skeleton key={i} width="100%" height={110} radius={16} />
          ))}
        </View>
      </Screen>
    )
  }

  return (
    <Screen scrollable style={{ paddingHorizontal: spacing[4] }} contentContainerStyle={{ paddingBottom: spacing[8] }}>
      <View style={{ paddingTop: spacing[6], paddingHorizontal: spacing[2], marginBottom: spacing[5] }}>
        <Text variant="h1" color={COLORS.text.primary}>Devices</Text>
        <Text variant="body" color={COLORS.text.secondary} style={{ marginTop: spacing[1] }}>
          {devices.length} device{devices.length !== 1 ? 's' : ''} have access to your account
        </Text>
      </View>

      {devices.length === 0 ? (
        <View style={[styles.empty, { paddingTop: spacing[12] }]}>
          <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: spacing[4] }}>📵</Text>
          <Text variant="h3" color={COLORS.text.primary} style={{ textAlign: 'center' }}>
            No Devices Found
          </Text>
          <Text variant="body" color={COLORS.text.secondary} style={{ textAlign: 'center', marginTop: spacing[2] }}>
            Devices are registered when you log in.
          </Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: spacing[2] }}>
          {devices.map((device) => (
            <DeviceCard
              key={device.deviceId}
              device={device}
              onRevoke={revokeDevice}
              isRevoking={isRevoking}
            />
          ))}
          <Button
            fullWidth
            variant="ghost"
            onPress={() => refetchDevices()}
            style={{ marginTop: spacing[4] }}
            accessibilityLabel="Refresh devices list"
          >
            Refresh
          </Button>
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  card: {},
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  currentBadge: {},
  revokeBtn: { alignSelf: 'flex-start' },
  empty: { alignItems: 'center' },
})
