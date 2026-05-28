import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { MaterialIcons, Feather } from '@expo/vector-icons'
import { VirtualCard } from '../../types/card.types'
import { Text } from '../ui/Text'
import { Card } from '../ui/Card'
import { useTheme } from '../../hooks/useTheme'

interface CardActionsProps {
  card: VirtualCard
  onFreeze: () => void
  onUnfreeze: () => void
  onReveal: () => void
  onSetLimit: () => void
  onCopyNumber: () => void
  isRevealed: boolean
  isLoading?: boolean
}

export function CardActions({
  card,
  onFreeze,
  onUnfreeze,
  onReveal,
  onSetLimit,
  onCopyNumber,
  isRevealed,
  isLoading
}: CardActionsProps) {
  const { COLORS, spacing, radius } = useTheme()

  const isFrozen = card.status === 'FROZEN'
  const isInactive = card.status === 'EXPIRED' || card.status === 'CANCELLED'

  const ActionTile = ({ 
    iconName, 
    label, 
    onPress, 
    disabled 
  }: { 
    iconName: keyof typeof Feather.glyphMap, 
    label: string, 
    onPress: () => void, 
    disabled?: boolean 
  }) => (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={styles.tileWrapper}>
      <Card variant="default" style={[styles.tile, disabled && { opacity: 0.4 }]}>
        <Feather name={iconName} size={24} color={COLORS.accent.primary} />
        <Text variant="caption" color={COLORS.text.primary} style={{ marginTop: 8, textAlign: 'center' }}>
          {label}
        </Text>
      </Card>
    </TouchableOpacity>
  )

  return (
    <View style={[styles.grid, { gap: spacing[4] }]}>
      <View style={[styles.row, { gap: spacing[4] }]}>
        <ActionTile 
          iconName={isRevealed ? 'eye-off' : 'eye'} 
          label={isRevealed ? 'Hide' : 'Reveal'} 
          onPress={onReveal} 
          disabled={isInactive || isFrozen || isLoading} 
        />
        <ActionTile 
          iconName={isFrozen ? 'play' : 'wind'} 
          label={isFrozen ? 'Unfreeze' : 'Freeze'} 
          onPress={isFrozen ? onUnfreeze : onFreeze} 
          disabled={isInactive || isLoading} 
        />
      </View>
      <View style={[styles.row, { gap: spacing[4] }]}>
        <ActionTile 
          iconName="copy" 
          label="Copy Number" 
          onPress={onCopyNumber} 
          disabled={isInactive || isFrozen || isLoading} 
        />
        <ActionTile 
          iconName="sliders" 
          label="Set Limit" 
          onPress={onSetLimit} 
          disabled={isInactive || isFrozen || isLoading} 
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
  },
  tileWrapper: {
    flex: 1,
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    minHeight: 90,
  },
})
