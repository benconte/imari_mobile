/**
 * QR Show screen — display own wallet QR code for receiving money.
 * - Increases screen brightness on mount, restores on unmount
 * - QR always has white card background regardless of theme
 * - Share QR (expo-sharing + react-native-view-shot)
 * - Copy wallet number (expo-clipboard)
 */

import React, { useEffect, useRef, useCallback } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import * as Brightness from 'expo-brightness'
import * as Clipboard from 'expo-clipboard'
import * as Sharing from 'expo-sharing'
import * as Haptics from 'expo-haptics'
import ViewShot from 'react-native-view-shot'
import QRCode from 'react-native-qrcode-svg'
import { useTheme } from '../../../src/hooks/useTheme'
import { useWallet } from '../../../src/hooks/useWallet'
import { Screen } from '../../../src/components/layout/Screen'
import { Text } from '../../../src/components/ui/Text'
import { Button } from '../../../src/components/ui/Button'
import { Chip } from '../../../src/components/ui/Chip'
import { Skeleton } from '../../../src/components/ui/Skeleton'

export default function ShowQRScreen() {
  const { COLORS, spacing, radius, typography } = useTheme()
  const { wallet, isLoadingWallet } = useWallet()
  const viewShotRef = useRef<ViewShot>(null)
  const brightnessRef = useRef<number>(0.5)

  // Boost brightness on mount, restore on unmount
  useEffect(() => {
    let restored = false

    async function boostBrightness() {
      const { status } = await Brightness.requestPermissionsAsync()
      if (status === 'granted') {
        brightnessRef.current = await Brightness.getBrightnessAsync()
        await Brightness.setBrightnessAsync(1.0)
      }
    }

    boostBrightness()

    return () => {
      if (restored) return
      restored = true
      Brightness.setBrightnessAsync(brightnessRef.current).catch(() => {})
    }
  }, [])

  const handleShareQR = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      const uri = await viewShotRef.current?.capture?.()
      if (!uri) return
      const canShare = await Sharing.isAvailableAsync()
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share my QR code' })
      }
    } catch {
      Alert.alert('Error', 'Could not capture QR code')
    }
  }, [])

  const handleCopyWalletNumber = useCallback(async () => {
    if (!wallet?.walletNumber) return
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    await Clipboard.setStringAsync(wallet.walletNumber)
    Alert.alert('Copied!', 'Wallet number copied to clipboard')
  }, [wallet?.walletNumber])

  const qrPayload = wallet
    ? JSON.stringify({ walletNumber: wallet.walletNumber, currency: wallet.currency })
    : ''

  const maskedWalletNumber = wallet?.walletNumber
    ? wallet.walletNumber.replace(/^(IMR-)(\d{6})(\d{4})$/, '$1••••••$3')
    : '••••••••••'

  return (
    <Screen scrollable={false} style={{ paddingHorizontal: spacing[4] }}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text variant="body" style={{ color: COLORS.accent.primary }}>
            ← Back
          </Text>
        </Pressable>
        <Text variant="h2" style={{ color: COLORS.text.primary }}>
          Receive Money
        </Text>
        <View style={{ width: 48 }} />
      </View>

      {/* QR Card — always white regardless of theme */}
      <View style={styles.cardOuter}>
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.95 }}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: '#FFFFFF',
                borderRadius: radius.xxl,
                padding: spacing[6],
              },
            ]}
          >
            {isLoadingWallet ? (
              <Skeleton width={220} height={220} radius={0} />
            ) : (
              <QRCode
                value={qrPayload || 'imari'}
                size={220}
                color="#0F1729"
                backgroundColor="#FFFFFF"
              />
            )}

            <View style={[styles.walletInfo, { marginTop: spacing[4] }]}>
              {isLoadingWallet ? (
                <>
                  <Skeleton width={140} height={20} style={{ marginBottom: 8 }} />
                  <Skeleton width={180} height={16} />
                </>
              ) : (
                <>
                  <Text
                    variant="h3"
                    style={{ color: '#0F1729', textAlign: 'center' }}
                  >
                    My Wallet
                  </Text>
                  <Text
                    style={{
                      fontFamily: typography.fontFamily.mono,
                      fontSize: 14,
                      color: '#6B7280',
                      textAlign: 'center',
                      marginTop: spacing[1],
                    }}
                  >
                    {maskedWalletNumber}
                  </Text>
                  <View style={{ marginTop: spacing[2], alignItems: 'center' }}>
                    <Chip label={wallet?.currency ?? 'RWF'} variant="default" />
                  </View>
                </>
              )}
            </View>
          </View>
        </ViewShot>
      </View>

      {/* Actions */}
      <View style={[styles.actions, { gap: spacing[3], marginTop: spacing[6] }]}>
        <Button variant="primary" fullWidth onPress={handleShareQR}>
          Share QR
        </Button>
        <Button variant="secondary" fullWidth onPress={handleCopyWalletNumber}>
          Copy Wallet Number
        </Button>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  cardOuter: {
    alignItems: 'center',
  },
  card: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  walletInfo: {
    alignItems: 'center',
  },
  actions: {},
})
