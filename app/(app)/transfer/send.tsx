/**
 * Send screen — Step 1 of 3.
 * Accepts a wallet number (IMR-XXXXXXXXXX format).
 * Shows recent P2P transfer contacts as quick-fill pills.
 */

import React, { useState, useCallback } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../../src/hooks/useTheme'
import { useTransactions } from '../../../src/hooks/useTransactions'
import { Screen } from '../../../src/components/layout/Screen'
import { Text } from '../../../src/components/ui/Text'
import { Input } from '../../../src/components/ui/Input'
import { Button } from '../../../src/components/ui/Button'
import { Badge } from '../../../src/components/ui/Badge'
import { Skeleton } from '../../../src/components/ui/Skeleton'
import { useTransfer } from '../../../src/hooks/useTransfer'
import type { RecentContact } from '../../../src/types/transfer.types'

// Validate IMR wallet number format: IMR-XXXXXXXXXX (10 digits)
function isValidWalletNumber(v: string): boolean {
  return /^IMR-\d{10}$/.test(v)
}

// Derive unique recent contacts from P2P DEBIT transactions
function deriveRecentContacts(transactions: { type: string; direction: string; description?: string | null }[]): RecentContact[] {
  const seen = new Set<string>()
  const contacts: RecentContact[] = []

  for (const txn of transactions) {
    if (txn.type !== 'P2P_TRANSFER' || txn.direction !== 'DEBIT') continue
    // We store description as wallet number in our mocks; real backend returns receiverWalletNumber
    const wallet = txn.description ?? ''
    if (!wallet || seen.has(wallet)) continue
    seen.add(wallet)
    contacts.push({ walletNumber: wallet, initials: wallet.slice(-2) })
    if (contacts.length >= 6) break
  }
  return contacts
}

export default function SendScreen() {
  const { COLORS, spacing, radius } = useTheme()
  const [walletNumber, setWalletNumber] = useState('')
  const isValid = isValidWalletNumber(walletNumber)
  const transfer = useTransfer()

  const { sections, isLoading: txLoading } = useTransactions()
  const allTransactions = sections.flatMap((s) => s.data)
  const recentContacts = deriveRecentContacts(allTransactions as { type: string; direction: string; description?: string | null }[])

  // Auto-resolve when wallet number becomes valid
  React.useEffect(() => {
    if (isValid) transfer.resolveRecipient(walletNumber)
  }, [walletNumber, isValid])

  const handleContinue = useCallback(() => {
    if (!isValid) return
    router.push({
      pathname: '/(app)/transfer/confirm',
      params: { walletNumber },
    })
  }, [isValid, walletNumber])

  const handleSelectContact = useCallback((contact: RecentContact) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setWalletNumber(contact.walletNumber)
  }, [])

  return (
    <Screen style={{ paddingHorizontal: spacing[4] }}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text variant="caption" style={{ color: COLORS.text.tertiary }}>
            Step 1 of 3
          </Text>
          <Text variant="h2" style={{ color: COLORS.text.primary, marginTop: 2 }}>
            Send Money
          </Text>
        </View>
        <Pressable onPress={() => router.back()}>
          <Text variant="h2" style={{ color: COLORS.text.secondary }}>✕</Text>
        </Pressable>
      </View>

      {/* Wallet number input */}
      <View style={{ marginTop: spacing[6] }}>
        <Input
          label="Wallet number"
          value={walletNumber}
          onChangeText={(t) => setWalletNumber(t.toUpperCase())}
          placeholder="IMR-0000000000"
          autoCapitalize="characters"
          rightIcon={
            isValid ? <Badge variant="success" label="Valid" /> : undefined
          }
        />
        <Text variant="caption" style={{ color: COLORS.text.tertiary, marginTop: spacing[1] }}>
          Format: IMR- followed by 10 digits
        </Text>
      </View>

      {/* Recent contacts */}
      {txLoading ? (
        <View style={[styles.recentRow, { marginTop: spacing[6] }]}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} width={56} height={56} radius={28} />
          ))}
        </View>
      ) : recentContacts.length > 0 ? (
        <View style={{ marginTop: spacing[6] }}>
          <Text variant="label" style={{ color: COLORS.text.secondary, marginBottom: spacing[3] }}>
            Recent
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.recentRow, { gap: spacing[4] }]}>
              {recentContacts.map((c) => (
                <Pressable
                  key={c.walletNumber}
                  onPress={() => handleSelectContact(c)}
                  style={{ alignItems: 'center', width: 64 }}
                >
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: COLORS.accent.primaryMuted,
                        borderRadius: radius.full,
                      },
                    ]}
                  >
                    <Text variant="label" style={{ color: COLORS.accent.primary }}>
                      {c.initials}
                    </Text>
                  </View>
                  <Text
                    variant="caption"
                    style={{ color: COLORS.text.tertiary, marginTop: 4, textAlign: 'center' }}
                    numberOfLines={1}
                  >
                    {c.walletNumber.slice(-4)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      ) : null}

      {/* Continue */}
      <View style={[styles.footer, { paddingBottom: spacing[8] }]}>
        <Button variant="primary" fullWidth disabled={!isValid} onPress={handleContinue}>
          Continue
        </Button>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 16,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
})
