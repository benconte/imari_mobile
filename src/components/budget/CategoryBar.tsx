import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '../../hooks/useTheme'
import { Text } from '../ui/Text'
import { ProgressBar } from '../ui/ProgressBar'
import { CategoryBudget } from '../../types/budget.types'
import { formatCurrency } from '../../lib/utils/currency'
import { SpendingCategory, SPENDING_CATEGORY_LABELS } from '../../types/transaction.types'

interface CategoryBarProps {
  categoryBudget: CategoryBudget
  currency: string
  onPress?: (category: SpendingCategory) => void
}

export function CategoryBar({ categoryBudget, currency, onPress }: CategoryBarProps) {
  const { COLORS, spacing, radius } = useTheme()
  const { category, spent, limit, alertAt } = categoryBudget

  const percentage = (spent / limit) * 100
  const isOverLimit = spent > limit
  const isApproaching = percentage >= alertAt * 100

  // Icon and color mapping
  let iconName: keyof typeof MaterialIcons.glyphMap = 'category'
  let iconColor = COLORS.accent.primary
  let iconBgColor = COLORS.accent.primaryMuted

  switch (category) {
    case 'FOOD_AND_DINING':
      iconName = 'restaurant'
      iconColor = '#FF6B35'
      iconBgColor = '#FF6B3520'
      break
    case 'TRANSPORT':
      iconName = 'directions-car'
      iconColor = '#4F8EF7'
      iconBgColor = '#4F8EF720'
      break
    case 'SHOPPING':
      iconName = 'shopping-bag'
      iconColor = '#A855F7'
      iconBgColor = '#A855F720'
      break
    case 'ENTERTAINMENT':
      iconName = 'local-play'
      iconColor = '#F0B429'
      iconBgColor = '#F0B42920'
      break
    case 'UTILITIES':
      iconName = 'bolt'
      iconColor = '#10B981'
      iconBgColor = '#10B98120'
      break
    case 'HEALTH':
      iconName = 'favorite'
      iconColor = '#EF4444'
      iconBgColor = '#EF444420'
      break
    case 'EDUCATION':
      iconName = 'school'
      iconColor = '#3B82F6'
      iconBgColor = '#3B82F620'
      break
    case 'TRAVEL':
      iconName = 'flight'
      iconColor = '#8B5CF6'
      iconBgColor = '#8B5CF620'
      break
  }

  const handlePress = () => {
    if (onPress) {
      onPress(category)
    }
  }

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={handlePress}
      disabled={!onPress}
      style={{ marginBottom: spacing[4] }}
    >
      <View style={styles.headerRow}>
        <View style={styles.leftGroup}>
          <View style={[styles.iconContainer, { backgroundColor: iconBgColor, borderRadius: radius.full }]}>
            <MaterialIcons name={iconName} size={18} color={iconColor} />
          </View>
          <View style={styles.labelGroup}>
            <Text variant="label" color={COLORS.text.primary}>
              {SPENDING_CATEGORY_LABELS[category] || category}
            </Text>
            {isApproaching && !isOverLimit && (
              <View style={[styles.warningDot, { backgroundColor: COLORS.status.warning }]} />
            )}
          </View>
        </View>

        <View style={styles.rightGroup}>
          <Text variant="caption" color={COLORS.text.primary} style={{ fontFamily: 'DMMono-Medium' }}>
            {formatCurrency(spent, currency)}
          </Text>
          <Text 
            variant="caption" 
            color={isOverLimit ? COLORS.status.error : COLORS.text.tertiary} 
            style={{ fontFamily: 'DMMono-Medium' }}
          >
            {' / '}{formatCurrency(limit, currency)}
          </Text>
        </View>
      </View>

      <ProgressBar value={percentage} height={6} />

      {isOverLimit && (
        <View style={{ marginTop: spacing[1], alignItems: 'flex-end' }}>
          <Text variant="caption" color={COLORS.status.error} style={{ fontFamily: 'DMMono-Medium' }}>
            +{formatCurrency(spent - limit, currency)} over
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  warningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
