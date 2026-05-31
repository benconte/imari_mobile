/**
 * Imari Settings Screen.
 *
 * Sections:
 *   Security:
 *     - Setup / Manage MFA (TOTP via POST /mfa/enable → POST /mfa/confirm)
 *     - Fingerprint Unlock toggle (BIOMETRICS_ENABLED storage key)
 *   Privacy:
 *     - Manage Devices → /settings/devices
 */

import React, { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import * as LocalAuthentication from 'expo-local-authentication'
import * as Haptics from 'expo-haptics'
import * as Clipboard from 'expo-clipboard'
import { router } from 'expo-router'
import { Image } from 'expo-image'
import { useTheme } from '../../src/hooks/useTheme'
import { useAuth } from '../../src/hooks/useAuth'
import { useProfile } from '../../src/hooks/useProfile'
import { api } from '../../src/lib/api'
import { storage } from '../../src/lib/storage'
import { STORAGE_KEYS } from '../../src/lib/constants'
import { useUIStore } from '../../src/stores/ui.store'
import { Text } from '../../src/components/ui/Text'
import { Button } from '../../src/components/ui/Button'
import { Screen } from '../../src/components/layout/Screen'
import { Input } from '../../src/components/ui/Input'
import { Skeleton } from '../../src/components/ui/Skeleton'
import { AxiosError } from 'axios'

// ── Sub-components ────────────────────────────────────────────────────────────

interface SettingRowProps {
  icon: string
  label: string
  subtitle?: string
  onPress?: () => void
  rightElement?: React.ReactNode
  destructive?: boolean
}

function SettingRow({ icon, label, subtitle, onPress, rightElement, destructive }: SettingRowProps) {
  const { COLORS, spacing, radius } = useTheme()
  const content = (
    <View
      style={[
        styles.row,
        {
          borderRadius: radius.lg,
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[3],
        },
      ]}
    >
      <Text style={{ fontSize: 20, marginRight: spacing[3] }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text variant="body" color={destructive ? COLORS.status.error : COLORS.text.primary}>
          {label}
        </Text>
        {subtitle && (
          <Text variant="caption" color={COLORS.text.tertiary} style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement ?? (
        onPress ? <Text variant="body" color={COLORS.text.tertiary}>›</Text> : null
      )}
    </View>
  )

  if (!onPress) return content

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {content}
    </Pressable>
  )
}

function SectionHeader({ title }: { title: string }) {
  const { COLORS, spacing } = useTheme()
  return (
    <Text
      variant="label"
      color={COLORS.text.tertiary}
      style={{ letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: spacing[2], paddingHorizontal: spacing[3] }}
    >
      {title}
    </Text>
  )
}

// ── MFA Setup Sheet (inline) ──────────────────────────────────────────────────

interface MfaSheetProps {
  onClose: () => void
  onSuccess: () => void
}

function MfaSetupSheet({ onClose, onSuccess }: MfaSheetProps) {
  const { COLORS, spacing, radius } = useTheme()
  const showToast = useUIStore(s => s.showToast)
  const [step, setStep] = useState<'init' | 'confirm' | 'done'>('init')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [formattedKey, setFormattedKey] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    initMfa()
  }, [])

  const initMfa = async () => {
    setLoading(true)
    try {
      const { data } = await api.post<{ data: { qrDataUrl: string; formattedKey: string; setupUrl: string } }>('/mfa/enable')
      setQrDataUrl(data.data.qrDataUrl)
      setFormattedKey(data.data.formattedKey)
      setStep('confirm')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      if (typeof msg === 'string' && msg.toLowerCase().includes('already enabled')) {
        Alert.alert('MFA Already Enabled', 'Multi-factor authentication is already active on your account.')
        onClose()
      } else {
        setError('Failed to initialize MFA setup. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const confirmMfa = async () => {
    if (totpCode.length !== 6) {
      setError('Enter your 6-digit authenticator code')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/mfa/confirm', { totpCode })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setStep('done')
    } catch (err) {
      if (err instanceof AxiosError) {
        console.log(err.response?.data);
      }
      setError('Invalid code. Make sure your device clock is synced and try again.')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setLoading(false)
    }
  }

  const copyKey = async () => {
    if (!formattedKey) return
    await Clipboard.setStringAsync(formattedKey.replace(/\s+/g, ''))
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    showToast({ message: 'Key copied to clipboard', variant: 'success' })
  }

  if (step === 'init') {
    return (
      <View style={[styles.sheet, { padding: spacing[6] }]}>
        <Text variant="h2" color={COLORS.text.primary} style={{ textAlign: 'center', marginBottom: spacing[4] }}>
          Setting up MFA…
        </Text>
      </View>
    )
  }

  if (step === 'done') {
    return (
      <View style={[styles.sheet, { padding: spacing[6], alignItems: 'center' }]}>
        <Text style={{ fontSize: 48, marginBottom: spacing[4] }}>✅</Text>
        <Text variant="h2" color={COLORS.text.primary} style={{ textAlign: 'center', marginBottom: spacing[2] }}>
          MFA Enabled
        </Text>
        <Text variant="body" color={COLORS.text.secondary} style={{ textAlign: 'center', marginBottom: spacing[6] }}>
          Your account is now protected with two-factor authentication.
        </Text>
        <Button fullWidth onPress={() => { onSuccess(); onClose() }}>Done</Button>
      </View>
    )
  }

  return (
    <ScrollView style={styles.sheet} contentContainerStyle={{ padding: spacing[6] }}>
      <Text variant="h2" color={COLORS.text.primary} style={{ marginBottom: spacing[2] }}>
        Set Up Authenticator
      </Text>
      <Text variant="body" color={COLORS.text.secondary} style={{ marginBottom: spacing[5] }}>
        Scan this QR code with Google Authenticator, Authy, or any TOTP app.
      </Text>

      {/* QR Code */}
      {qrDataUrl ? (
        <View style={[styles.qrWrap, { backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing[3], alignSelf: 'center', marginBottom: spacing[4] }]}>
          <Image source={{ uri: qrDataUrl }} style={{ width: 180, height: 180 }} />
        </View>
      ) : null}

      {/* Manual key */}
      <Pressable
        onPress={copyKey}
        style={({ pressed }) => [
          styles.keyBox,
          {
            backgroundColor: COLORS.background.secondary,
            borderRadius: radius.lg,
            padding: spacing[3],
            marginBottom: spacing[5],
            opacity: pressed ? 0.7 : 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }
        ]}
        accessibilityRole="button"
        accessibilityLabel="Copy setup key"
      >
        <View style={{ flex: 1 }}>
          <Text variant="caption" color={COLORS.text.tertiary} style={{ marginBottom: 4 }}>
            Or enter this key manually:
          </Text>
          <Text variant="body" color={COLORS.accent.primary} style={{ fontFamily: 'DMSans_700Bold', letterSpacing: 2 }}>
            {formattedKey}
          </Text>
        </View>
        <Text style={{ fontSize: 20 }}>📋</Text>
      </Pressable>

      {/* TOTP input */}
      <Input
        label="Authenticator Code"
        value={totpCode}
        onChangeText={(t) => {
          setTotpCode(t.replace(/\D/g, '').slice(0, 6))
          setError('')
        }}
        keyboardType="number-pad"
        placeholder="6-digit code"
        autoComplete="one-time-code"
        error={error || undefined}
      />

      <Button
        fullWidth
        loading={loading}
        onPress={confirmMfa}
        style={{ marginTop: spacing[4] }}
        accessibilityLabel="Verify and enable MFA"
      >
        Enable MFA
      </Button>
      <Button
        fullWidth
        variant="ghost"
        onPress={onClose}
        style={{ marginTop: spacing[2] }}
      >
        Cancel
      </Button>
    </ScrollView>
  )
}

// ── Disable MFA Sheet ─────────────────────────────────────────────────────────

interface DisableMfaSheetProps {
  onClose: () => void
  onSuccess: () => void
}

function DisableMfaSheet({ onClose, onSuccess }: DisableMfaSheetProps) {
  const { COLORS, spacing } = useTheme()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDisable = async () => {
    if (code.length < 6) {
      setError('Enter your 6-digit authenticator code or a backup code')
      return
    }
    setLoading(true)
    try {
      await api.delete('/mfa/disable', { data: { code } })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onSuccess()
      onClose()
    } catch {
      setError('Invalid code. Please try again.')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.sheet, { padding: spacing[6] }]}>
      <Text variant="h2" color={COLORS.text.primary} style={{ marginBottom: spacing[2] }}>
        Disable MFA
      </Text>
      <Text variant="body" color={COLORS.text.secondary} style={{ marginBottom: spacing[5] }}>
        Enter your current authenticator code (or a backup code) to disable two-factor authentication.
      </Text>
      <Input
        label="Code"
        value={code}
        onChangeText={(t) => { setCode(t.slice(0, 10)); setError('') }}
        keyboardType="number-pad"
        placeholder="6-digit code or backup code"
        error={error || undefined}
      />
      <Button fullWidth loading={loading} onPress={handleDisable} style={{ marginTop: spacing[4] }}>
        Disable MFA
      </Button>
      <Button fullWidth variant="ghost" onPress={onClose} style={{ marginTop: spacing[2] }}>
        Cancel
      </Button>
    </View>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { COLORS, spacing } = useTheme()
  const { user, setUser } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile()

  const [biometricsEnabled, setBiometricsEnabled] = useState(false)
  const [biometricsAvailable, setBiometricsAvailable] = useState(false)
  const [mfaSheet, setMfaSheet] = useState<'enable' | 'disable' | null>(null)
  const [isMfaEnabled, setIsMfaEnabled] = useState(user?.isMfaEnabled ?? false)

  // Load biometrics preference and hardware availability
  useEffect(() => {
    const init = async () => {
      const [pref, hasHardware, isEnrolled] = await Promise.all([
        storage.get(STORAGE_KEYS.BIOMETRICS_ENABLED),
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ])
      setBiometricsAvailable(hasHardware && isEnrolled)
      setBiometricsEnabled(pref === 'true')
    }
    init()
  }, [])

  // Keep local MFA state in sync with profile
  useEffect(() => {
    if (profile?.isMfaEnabled !== undefined) {
      setIsMfaEnabled(profile.isMfaEnabled)
    }
  }, [profile?.isMfaEnabled])

  const toggleBiometrics = useCallback(async (value: boolean) => {
    if (value && !biometricsAvailable) {
      Alert.alert(
        'No Biometrics Found',
        'Please set up fingerprint or face ID in your device settings first.',
      )
      return
    }

    if (value) {
      // Prompt once to confirm they can authenticate
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm to enable biometric unlock',
        cancelLabel: 'Cancel',
      })
      if (!result.success) return
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await storage.set(STORAGE_KEYS.BIOMETRICS_ENABLED, value ? 'true' : 'false')
    setBiometricsEnabled(value)
  }, [biometricsAvailable])

  if (profileLoading) {
    return (
      <Screen scrollable style={{ paddingHorizontal: spacing[6] }}>
        <View style={{ paddingTop: spacing[6], gap: spacing[3] }}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} width="100%" height={52} />)}
        </View>
      </Screen>
    )
  }

  return (
    <>
      <Screen scrollable style={{ paddingHorizontal: spacing[4] }} contentContainerStyle={{ paddingBottom: spacing[8] }}>
        {/* Title */}
        <View style={{ paddingTop: spacing[6], paddingHorizontal: spacing[2], marginBottom: spacing[6] }}>
          <Text variant="h1" color={COLORS.text.primary}>Settings</Text>
        </View>

        {/* Security section */}
        <View style={{ marginBottom: spacing[6] }}>
          <SectionHeader title="Security" />

          <SettingRow
            icon="🔐"
            label={isMfaEnabled ? 'Two-Factor Authentication' : 'Setup Two-Factor Auth'}
            subtitle={isMfaEnabled ? 'MFA is active — your account is protected' : 'Add an extra layer of security'}
            onPress={() => setMfaSheet(isMfaEnabled ? 'disable' : 'enable')}
            rightElement={
              <View style={[styles.badge, { backgroundColor: isMfaEnabled ? COLORS.status.successMuted : COLORS.background.secondary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }]}>
                <Text variant="caption" color={isMfaEnabled ? COLORS.status.success : COLORS.text.tertiary}>
                  {isMfaEnabled ? 'ON' : 'OFF'}
                </Text>
              </View>
            }
          />

          {biometricsAvailable && (
            <SettingRow
              icon="👆"
              label="Fingerprint / Face Unlock"
              subtitle="Use biometrics to unlock the app"
              rightElement={
                <Switch
                  value={biometricsEnabled}
                  onValueChange={toggleBiometrics}
                  trackColor={{ false: COLORS.border.default, true: COLORS.accent.primary }}
                  thumbColor={biometricsEnabled ? '#fff' : COLORS.text.tertiary}
                  accessibilityLabel="Toggle fingerprint unlock"
                />
              }
            />
          )}

          {!biometricsAvailable && (
            <SettingRow
              icon="👆"
              label="Fingerprint / Face Unlock"
              subtitle="No biometrics enrolled — set up in device settings"
              rightElement={<Text variant="caption" color={COLORS.text.tertiary}>Unavailable</Text>}
            />
          )}
        </View>

        {/* Privacy section */}
        <View style={{ marginBottom: spacing[6] }}>
          <SectionHeader title="Privacy & Devices" />
          <SettingRow
            icon="📱"
            label="Manage Devices"
            subtitle="View and revoke trusted devices"
            onPress={() => router.push('/(app)/settings/devices' as never)}
          />
        </View>
      </Screen>

      {/* MFA Sheets — rendered as full-screen overlay */}
      {mfaSheet === 'enable' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.background.overlay }]} onPress={() => setMfaSheet(null)} />
          <View style={[styles.sheetWrap, { backgroundColor: COLORS.card.background }]}>
            <MfaSetupSheet
              onClose={() => setMfaSheet(null)}
              onSuccess={() => {
                setIsMfaEnabled(true)
                if (user) setUser({ ...user, isMfaEnabled: true })
              }}
            />
          </View>
        </KeyboardAvoidingView>
      )}

      {mfaSheet === 'disable' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.background.overlay }]} onPress={() => setMfaSheet(null)} />
          <View style={[styles.sheetWrap, { backgroundColor: COLORS.card.background }]}>
            <DisableMfaSheet
              onClose={() => setMfaSheet(null)}
              onSuccess={() => {
                setIsMfaEnabled(false)
                if (user) setUser({ ...user, isMfaEnabled: false })
              }}
            />
          </View>
        </KeyboardAvoidingView>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  badge: {},
  backdrop: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  sheetWrap: { maxHeight: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheet: {},
  qrWrap: {},
  keyBox: {},
})
