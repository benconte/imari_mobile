/**
 * PinUnlockSheet — full-screen modal that prompts for the wallet PIN.
 * Calls POST /wallet/pin/verify to validate against the backend.
 *
 * Backend gap: POST /wallet/pin/verify is not yet implemented.
 * Until available: blocks access with a clear message (does NOT grant access silently).
 *
 * Note: verifyWalletPin was removed from useWallet (it was dead code).
 * This component calls the API directly — it's the only consumer.
 */

import React, { useState } from 'react'
import { Modal, View, StyleSheet, Pressable } from 'react-native'
import type { AxiosError } from 'axios'
import { Ionicons } from '@expo/vector-icons'
import { PinInput } from '../ui/PinInput'
import { Text } from '../ui/Text'
import { useTheme } from '../../hooks/useTheme'
import { api } from '../../lib/api'
import { spacing } from '../../theme/spacing'

interface PinUnlockSheetProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

async function verifyPin(pin: string): Promise<void> {
  try {
    await api.post('/wallet/pin/verify', { pin })
  } catch (err) {
    const axiosErr = err as AxiosError<{ error?: { message?: string }; message?: string }>
    if (axiosErr?.response?.status === 404) {
      throw new Error('PIN_ENDPOINT_UNAVAILABLE')
    }
    const msg =
      axiosErr?.response?.data?.error?.message ??
      axiosErr?.response?.data?.message ??
      'Incorrect PIN. Please try again.'
    throw new Error(msg)
  }
}

export function PinUnlockSheet({ visible, onClose, onSuccess }: PinUnlockSheetProps) {
  const { COLORS } = useTheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleComplete(pin: string) {
    setLoading(true)
    setError(null)
    try {
      await verifyPin(pin)
      onSuccess()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Incorrect PIN. Please try again.'

      if (msg === 'PIN_ENDPOINT_UNAVAILABLE') {
        setError('PIN verification is temporarily unavailable. Please try again later.')
      } else if (msg.toLowerCase().includes('locked')) {
        setError('Too many incorrect attempts. Your PIN is temporarily locked.')
      } else {
        setError('Incorrect PIN. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setError(null)
    onClose()
  }

  return (
    <Modal visible={visible} transparent={false} animationType="none" statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: COLORS.background.primary }]}>
        <View style={styles.header}>
          <Pressable onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Close PIN unlock">
            <Ionicons name="close" size={28} color={COLORS.text.primary} />
          </Pressable>
        </View>
        <View style={styles.content}>
          <PinInput
            title="Unlock Wallet"
            subtitle="Enter your 4-digit PIN to view your balance"
            onComplete={handleComplete}
            loading={loading}
            error={error}
          />
          {error?.includes('temporarily unavailable') && (
            <Text variant="caption" style={[styles.hint, { color: COLORS.text.tertiary }]}>
              The PIN verification service is being set up. Please check back soon.
            </Text>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing[12],
  },
  header: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[8],
  },
  hint: {
    textAlign: 'center',
    marginTop: spacing[4],
    paddingHorizontal: spacing[6],
  },
})
