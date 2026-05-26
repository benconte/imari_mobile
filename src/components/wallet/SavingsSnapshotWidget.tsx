/**
 * SavingsSnapshotWidget — compact savings summary card for home screen.
 * Shows total saved and active vault count. Taps to navigate to savings tab.
 */

import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { Card } from '../ui/Card'
import { Text } from '../ui/Text'
import { Skeleton } from '../ui/Skeleton'
import { useTheme } from '../../hooks/useTheme'
import { formatCurrency } from '../../lib/utils/currency'
import { spacing } from '../../theme/spacing'

interface SavingsSnapshotWidgetProps {
  totalSaved: number
  activeVaultsCount: number
  isLoading: boolean
  currency: string
  onPress: () => void
}

export function SavingsSnapshotWidget({
  totalSaved,
  activeVaultsCount,
  isLoading,
  currency,
  onPress,
}: SavingsSnapshotWidgetProps) {
  const { COLORS } = useTheme()

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card variant="default" padding={4}>
        <View style={styles.row}>
          <View style={styles.col}>
            {isLoading ? (
              <Skeleton width={100} height={24} radius={4} />
            ) : (
              <Text variant="monoLg" style={{ color: COLORS.text.primary }}>
                {formatCurrency(totalSaved, currency)}
              </Text>
            )}
            <Text variant="caption" style={{ color: COLORS.text.secondary }}>
              Total Saved
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: COLORS.border.subtle }]} />
          <View style={styles.col}>
            {isLoading ? (
              <Skeleton width={40} height={24} radius={4} />
            ) : (
              <Text variant="monoLg" style={{ color: COLORS.text.primary }}>
                {activeVaultsCount}
              </Text>
            )}
            <Text variant="caption" style={{ color: COLORS.text.secondary }}>
              Active Vaults
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    width: 1,
    height: 40,
    marginHorizontal: spacing[3],
  },
})
