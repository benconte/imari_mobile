/**
 * Edit Profile Screen.
 *
 * Allows updating firstName, lastName, preferredCurrency.
 * Email and phone are disabled (require separate backend flows).
 * Image picker wired to select a photo — uploads via placeholder until
 * the backend file upload endpoint is ready.
 */

import React, { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { useTheme } from '../../src/hooks/useTheme'
import { useProfile } from '../../src/hooks/useProfile'
import { Text } from '../../src/components/ui/Text'
import { Input } from '../../src/components/ui/Input'
import { Button } from '../../src/components/ui/Button'
import { Screen } from '../../src/components/layout/Screen'
import { Chip } from '../../src/components/ui/Chip'
import { KYC_PLACEHOLDER_URL } from '../../src/hooks/useKYC'

const CURRENCIES = ['RWF', 'USD', 'EUR', 'KES', 'UGX', 'TZS'] as const
type Currency = (typeof CURRENCIES)[number]

export default function EditProfileScreen() {
  const { COLORS, spacing, radius } = useTheme()
  const { profile, isLoading, updateProfile, isUpdating } = useProfile()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [currency, setCurrency] = useState<Currency>('RWF')
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({})

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName ?? '')
      setLastName(profile.lastName ?? '')
      setCurrency((profile.preferredCurrency as Currency) ?? 'RWF')
    }
  }, [profile])

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (!result.canceled && result.assets[0]) {
      setLocalPhotoUri(result.assets[0].uri)
      // TODO: Upload to S3 via /identity/kyc/upload-url and pass real URL to updateProfile
      // For now we store the local URI for preview only
    }
  }

  const validate = () => {
    const errs: { firstName?: string; lastName?: string } = {}
    if (!firstName.trim()) errs.firstName = 'First name is required'
    if (!lastName.trim()) errs.lastName = 'Last name is required'
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }
    setErrors({})

    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        preferredCurrency: currency,
        // TODO: Replace KYC_PLACEHOLDER_URL with real uploaded photo URL
        ...(localPhotoUri ? { profilePhotoUrl: KYC_PLACEHOLDER_URL } : {}),
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert('Saved', 'Profile updated successfully.', [
        { text: 'OK' },
      ])
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Could not save changes.'
      Alert.alert('Error', msg)
    }
  }

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?'

  return (
    <Screen scrollable style={{ paddingHorizontal: spacing[6] }}>
      {/* Header */}
      <View style={{ paddingTop: spacing[6], marginBottom: spacing[6], flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={{ marginRight: spacing[4] }}>
          <Text variant="body" color={COLORS.text.tertiary}>←</Text>
        </Pressable>
        <Text variant="h1" color={COLORS.text.primary}>Edit Profile</Text>
      </View>

      {/* Avatar editor */}
      <View style={{ alignItems: 'center', marginBottom: spacing[6] }}>
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
          <Text variant="h1" color={COLORS.accent.primary} style={{ fontFamily: 'DMSans_700Bold' }}>
            {initials}
          </Text>
        </View>
        <Pressable
          onPress={handlePickPhoto}
          style={{ marginTop: spacing[3] }}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
        >
          <Text variant="label" color={COLORS.accent.primary}>
            {localPhotoUri ? '✓ Photo selected' : 'Change Photo'}
          </Text>
        </Pressable>
        {localPhotoUri && (
          <Text variant="caption" color={COLORS.text.tertiary} style={{ marginTop: spacing[1], textAlign: 'center' }}>
            Photo will be uploaded when file storage is enabled
          </Text>
        )}
      </View>

      {/* Form */}
      <View style={{ gap: spacing[4] }}>
        <View style={{ flexDirection: 'row', gap: spacing[3] }}>
          <View style={{ flex: 1 }}>
            <Input
              label="First Name"
              value={firstName}
              onChangeText={(t) => { setFirstName(t); setErrors((e) => ({ ...e, firstName: undefined })) }}
              error={errors.firstName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Last Name"
              value={lastName}
              onChangeText={(t) => { setLastName(t); setErrors((e) => ({ ...e, lastName: undefined })) }}
              error={errors.lastName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>
        </View>

        <View style={{ opacity: 0.5 }}>
          <Input
            label="Email"
            value={profile?.email ?? ''}
            onChangeText={() => { }}
            editable={false}
          />
        </View>

        <View style={{ opacity: 0.5 }}>
          <Input
            label="Phone"
            value={profile?.phone ?? ''}
            onChangeText={() => { }}
            editable={false}
          />
        </View>

        {/* Currency selector */}
        <View>
          <Text variant="label" color={COLORS.text.secondary} style={{ marginBottom: spacing[2] }}>
            Preferred Currency
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: spacing[2] }}>
              {CURRENCIES.map((cur) => (
                <Chip
                  key={cur}
                  label={cur}
                  active={currency === cur}
                  onPress={() => {
                    setCurrency(cur)
                    Haptics.selectionAsync()
                  }}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      <Button
        fullWidth
        size="lg"
        loading={isUpdating}
        onPress={handleSave}
        style={{ marginTop: spacing[8], marginBottom: spacing[8] }}
        accessibilityLabel="Save changes"
      >
        Save Changes
      </Button>
    </Screen>
  )
}

const styles = StyleSheet.create({
  avatar: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
})
