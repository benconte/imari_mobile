/**
 * Imari Profile Screen — full implementation (Session 11).
 *
 * Sections: ProfileHeader · KYCStatusCard · Account · Identity · Preferences · Support
 * Logout confirmation sheet before signing out.
 */

import React, { useState } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { useTheme } from '../../src/hooks/useTheme'
import { useAuth } from '../../src/hooks/useAuth'
import { useProfile } from '../../src/hooks/useProfile'
import { Text } from '../../src/components/ui/Text'
import { Button } from '../../src/components/ui/Button'
import { Screen } from '../../src/components/layout/Screen'
import { Skeleton } from '../../src/components/ui/Skeleton'
import type { KYCStatus } from '../../src/types/auth.types'

// ── Sub-components ────────────────────────────────────────────────────────────

function ProfileHeader({ firstName = '', lastName = '', email = '', phone = '', photoUrl = null as string | null }) {
  const { COLORS, spacing, radius } = useTheme()
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?'

  return (
    <View style={[styles.header, { paddingVertical: spacing[6] }]}>
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: COLORS.accent.primaryMuted,
            borderRadius: radius.full,
            borderWidth: 2,
            borderColor: COLORS.accent.primary,
          },
        ]}
      >
        <Text
          variant="h1"
          color={COLORS.accent.primary}
          style={{ fontFamily: 'DMSans_700Bold' }}
        >
          {initials}
        </Text>
      </View>

      <Text variant="h2" color={COLORS.text.primary} style={{ marginTop: spacing[3] }}>
        {firstName} {lastName}
      </Text>
      <Text variant="bodySmall" color={COLORS.text.secondary} style={{ marginTop: spacing[1] }}>
        {email}
      </Text>
      {!!phone && (
        <Text variant="bodySmall" color={COLORS.text.tertiary} style={{ marginTop: 2 }}>
          {phone}
        </Text>
      )}
    </View>
  )
}



function KYCStatusCard({ status }: { status: KYCStatus }) {
  const { COLORS, spacing, radius } = useTheme()
  if (status === 'VERIFIED') return null

  const cfg = {
    NOT_STARTED: {
      borderColor: COLORS.border.default,
      labelColor: COLORS.text.secondary,
      emoji: '🛡️',
      label: 'Verify your identity',
      description: 'Complete KYC to unlock all features',
      showChevron: true,
    },
    IN_PROGRESS: {
      borderColor: COLORS.status.warning,
      labelColor: COLORS.status.warning,
      emoji: '⏳',
      label: 'Under Review',
      description: 'Your documents are being verified',
      showChevron: false,
    },
    REJECTED: {
      borderColor: COLORS.status.error,
      labelColor: COLORS.status.error,
      emoji: '⚠️',
      label: 'Verification Failed',
      description: 'Please resubmit your documents',
      showChevron: true,
    },
  }[status]

  const isInteractive = status === 'NOT_STARTED' || status === 'REJECTED'

  return (
    <Pressable
      onPress={() => {
        if (!isInteractive) return
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        router.push('/(app)/kyc' as never)
      }}
      style={[
        styles.kycCard,
        {
          backgroundColor: COLORS.card.background,
          borderColor: cfg.borderColor,
          borderRadius: radius.xl,
          padding: spacing[4],
          marginBottom: spacing[5],
          borderWidth: 1.5,
        },
      ]}
      accessibilityRole={isInteractive ? 'button' : 'none'}
      accessibilityLabel={cfg.label}
    >
      <View style={styles.kycRow}>
        <Text style={{ fontSize: 24, marginRight: spacing[3] }}>{cfg.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text variant="label" color={cfg.labelColor}>{cfg.label}</Text>
          <Text variant="bodySmall" color={COLORS.text.secondary}>{cfg.description}</Text>
        </View>
        {cfg.showChevron && (
          <Text variant="body" color={COLORS.text.tertiary}>›</Text>
        )}
      </View>
    </Pressable>
  )
}

interface MenuItemProps {
  icon: string
  label: string
  onPress: () => void
  value?: string
  destructive?: boolean
}

function MenuItem({ icon, label, onPress, value, destructive = false }: MenuItemProps) {
  const { COLORS, spacing, radius } = useTheme()
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      style={({ pressed }) => [
        styles.menuItem,
        {
          backgroundColor: pressed ? COLORS.background.secondary : 'transparent',
          borderRadius: radius.lg,
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[3],
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={{ fontSize: 18, marginRight: spacing[3] }}>{icon}</Text>
      <Text
        variant="body"
        color={destructive ? COLORS.status.error : COLORS.text.primary}
        style={{ flex: 1 }}
      >
        {label}
      </Text>
      {value ? (
        <Text variant="bodySmall" color={COLORS.text.tertiary}>{value}</Text>
      ) : (
        <Text variant="body" color={COLORS.text.tertiary}>›</Text>
      )}
    </Pressable>
  )
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { COLORS, spacing } = useTheme()
  return (
    <View style={{ marginBottom: spacing[5] }}>
      <Text
        variant="label"
        color={COLORS.text.tertiary}
        style={{ letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: spacing[2], paddingHorizontal: spacing[3] }}
      >
        {title}
      </Text>
      {children}
    </View>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { COLORS, spacing } = useTheme()
  const { logout } = useAuth()
  const { profile, isLoading } = useProfile()
  const [showLogout, setShowLogout] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      router.replace('/auth/login' as never)
    } catch {
      Alert.alert('Error', 'Could not sign out. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <Screen scrollable style={{ paddingHorizontal: spacing[6] }}>
        <View style={{ paddingTop: spacing[6], alignItems: 'center', gap: spacing[3] }}>
          <Skeleton width={80} height={80} radius={40} />
          <Skeleton width={160} height={20} />
          <Skeleton width={120} height={16} />
        </View>
        <View style={{ marginTop: spacing[6], gap: spacing[3] }}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} width="100%" height={52} />)}
        </View>
      </Screen>
    )
  }

  const kycStatus = (profile?.kycStatus ?? 'NOT_STARTED') as KYCStatus

  return (
    <>
      <Screen
        scrollable
        style={{ paddingHorizontal: spacing[6] }}
        contentContainerStyle={{ paddingBottom: spacing[8] }}
      >
        <ProfileHeader
          firstName={profile?.firstName}
          lastName={profile?.lastName}
          email={profile?.email}
          phone={profile?.phone}
          photoUrl={profile?.profilePhotoUrl}
        />

        <KYCStatusCard status={kycStatus} />

        <MenuSection title="Account">
          <MenuItem
            icon="✏️"
            label="Edit Profile"
            onPress={() => router.push('/(app)/edit-profile' as never)}
          />
          <MenuItem
            icon="🔔"
            label="Notifications"
            onPress={() => router.push('/(app)/notifications' as never)}
          />
        </MenuSection>

        <MenuSection title="Identity">
          <MenuItem
            icon="🛡️"
            label="KYC Verification"
            value={kycStatus === 'VERIFIED' ? 'Verified ✓' : undefined}
            onPress={() => {
              if (kycStatus === 'IN_PROGRESS') {
                router.push('/(app)/kyc-pending' as never)
              } else {
                router.push('/(app)/kyc' as never)
              }
            }}
          />
        </MenuSection>

        <MenuSection title="Security">
          <MenuItem
            icon="⚙️"
            label="Settings"
            onPress={() => router.push('/(app)/settings' as never)}
          />
          <MenuItem
            icon="📱"
            label="Devices"
            onPress={() => router.push('/(app)/settings/devices' as never)}
          />
        </MenuSection>

        <MenuSection title="Preferences">
          <MenuItem
            icon="💰"
            label="Currency"
            value={profile?.preferredCurrency ?? 'RWF'}
            onPress={() => {
              // TODO: inline currency sheet
              Alert.alert('Currency', 'Currency selector coming soon.')
            }}
          />
        </MenuSection>

        <MenuSection title="Support">
          <MenuItem
            icon="❓"
            label="Help Center"
            onPress={() => Alert.alert('Help', 'Visit support.imari.app')}
          />
          <MenuItem
            icon="💬"
            label="Contact Us"
            onPress={() => Alert.alert('Contact', 'support@imari.app')}
          />
        </MenuSection>

        <Button
          fullWidth
          variant="ghost"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            setShowLogout(true)
          }}
          style={{ marginTop: spacing[2] }}
          accessibilityLabel="Sign out"
        >
          <Text variant="body" color={COLORS.status.error}>Sign Out</Text>
        </Button>
      </Screen>

      {/* Logout confirmation */}
      {showLogout && (
        <Pressable
          style={[styles.modalBackdrop, { backgroundColor: COLORS.background.overlay }]}
          onPress={() => setShowLogout(false)}
        >
          <Pressable
            style={[
              styles.modalSheet,
              {
                backgroundColor: COLORS.card.background,
                paddingHorizontal: spacing[6],
                paddingTop: spacing[6],
                paddingBottom: spacing[8],
              },
            ]}
          >
            <Text variant="h2" color={COLORS.text.primary} style={{ textAlign: 'center' }}>
              Sign Out?
            </Text>
            <Text
              variant="body"
              color={COLORS.text.secondary}
              style={{ textAlign: 'center', marginTop: spacing[2], marginBottom: spacing[6] }}
            >
              You will need to sign in again to access your account.
            </Text>
            <Button fullWidth onPress={handleLogout} accessibilityLabel="Confirm sign out">
              <Text variant="label" color={COLORS.status.error}>Yes, Sign Out</Text>
            </Button>
            <Button
              fullWidth
              variant="ghost"
              onPress={() => setShowLogout(false)}
              style={{ marginTop: spacing[2] }}
            >
              Cancel
            </Button>
          </Pressable>
        </Pressable>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  header: { alignItems: 'center' },
  avatar: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  kycCard: {},
  kycRow: { flexDirection: 'row', alignItems: 'center' },
  menuItem: { flexDirection: 'row', alignItems: 'center', minHeight: 52 },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
})
