/**
 * KYC Pending Screen.
 *
 * Shown when kycStatus === 'IN_PROGRESS'.
 * Blocks access to all app features until the backend approves the KYC submission.
 * "Check Status" re-fetches the profile — if VERIFIED, routes to home.
 */

import React from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'

import { useTheme } from '../../src/hooks/useTheme'
import { useAuth } from '../../src/hooks/useAuth'
import { useKYC } from '../../src/hooks/useKYC'

import { Text } from '../../src/components/ui/Text'
import { Button } from '../../src/components/ui/Button'
import { Screen } from '../../src/components/layout/Screen'

export default function KYCPendingScreen() {
  const { COLORS, spacing, radius } = useTheme()

  const { logout } = useAuth()
  const { kycStatus, isLoading, refetch } = useKYC()

  const handleCheckStatus = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    // refetch() returns QueryObserverResult — read fresh data from it directly.
    // Reading `kycStatus` from the closure would be stale (always IN_PROGRESS).
    const result = await refetch()
    const freshStatus = result.data?.kycStatus

    if (freshStatus === 'VERIFIED') {
      router.replace('/(app)/(tabs)/home' as never)
    } else if (freshStatus === 'REJECTED') {
      router.replace('/(app)/kyc' as never)
    } else {
      // still IN_PROGRESS — show feedback
      Alert.alert(
        'Still Under Review',
        'Your documents are still being verified. We will notify you once the process is complete.'
      )
    }
  }

  return (
    <Screen
      style={{
        flex: 1,
        paddingHorizontal: spacing[6],
        paddingTop: spacing[6],
        justifyContent: 'center',
      }}
    >
      {/* Status Icon */}
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: COLORS.status.warningMuted,
            borderColor: COLORS.status.warning,
            borderRadius: radius.full,
            alignSelf: 'center',
          },
        ]}
      >
        <Text style={styles.icon}>🔍</Text>
      </View>

      {/* Heading */}
      <Text
        variant="h1"
        color={COLORS.text.primary}
        style={{
          textAlign: 'center',
          marginTop: spacing[6],
          alignSelf: 'center',
        }}
      >
        Under Review
      </Text>

      {/* Description */}
      <Text
        variant="body"
        color={COLORS.text.secondary}
        style={{
          textAlign: 'center',
          marginTop: spacing[3],
          lineHeight: 24,
          alignSelf: 'center',
        }}
      >
        Your identity documents are being verified.{'\n'}
        This usually takes 1–2 business days.{'\n'}
        We'll notify you once it's done.
      </Text>

      {/* Status Badge */}
      <View
        style={[
          styles.badge,
          {
            backgroundColor: COLORS.status.warningMuted,
            borderRadius: radius.full,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[1],
            marginTop: spacing[6],
            alignSelf: 'center',
          },
        ]}
      >
        <Text variant="label" color={COLORS.status.warning}>
          Verification Pending
        </Text>
      </View>

      {/* What Happens Next */}
      <View
        style={[
          styles.infoCard,
          {
            backgroundColor: COLORS.background.secondary,
            borderRadius: radius.xl,
            padding: spacing[5],
            marginTop: spacing[8],
          },
        ]}
      >
        <Text
          variant="label"
          color={COLORS.text.primary}
          style={{ marginBottom: spacing[4] }}
        >
          What happens next?
        </Text>

        {[
          {
            icon: '📋',
            text: 'Our team reviews your documents',
          },
          {
            icon: '🔔',
            text: 'You receive a push notification with the result',
          },
          {
            icon: '✅',
            text: 'Once approved, you get full access to Imari',
          },
        ].map(({ icon, text }, index, arr) => (
          <View
            key={text}
            style={[
              styles.infoRow,
              {
                marginBottom:
                  index !== arr.length - 1 ? spacing[4] : 0,
              },
            ]}
          >
            <Text
              variant="body"
              style={{ marginRight: spacing[3] }}
            >
              {icon}
            </Text>

            <Text
              variant="bodySmall"
              color={COLORS.text.secondary}
              style={{ flex: 1, lineHeight: 22 }}
            >
              {text}
            </Text>
          </View>
        ))}
      </View>

      {/* Primary Action */}
      <Button
        fullWidth
        size="lg"
        loading={isLoading}
        onPress={handleCheckStatus}
        style={{ marginTop: spacing[8] }}
        accessibilityLabel="Check verification status"
      >
        Check Status
      </Button>

      {/* Logout */}
      <Button
        fullWidth
        variant="ghost"
        onPress={() => logout()}
        style={{ marginTop: spacing[3] }}
        accessibilityLabel="Sign out"
      >
        Sign Out
      </Button>
    </Screen>
  )
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 80,
    height: 80,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: 38,
    lineHeight: 38,
    textAlign: 'center',
  },

  badge: {},

  infoCard: {
    width: '100%',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
})
