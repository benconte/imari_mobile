import React, { useState } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Screen } from '../../../src/components/layout/Screen'
import { Text } from '../../../src/components/ui/Text'
import { Button } from '../../../src/components/ui/Button'
import { Card } from '../../../src/components/ui/Card'
import { BottomSheet } from '../../../src/components/ui/BottomSheet'
import { BudgetRing } from '../../../src/components/budget/BudgetRing'
import { CategoryBar } from '../../../src/components/budget/CategoryBar'
import { useBudgetDetail } from '../../../src/hooks/useBudget'
import { useTheme } from '../../../src/hooks/useTheme'
import { formatCurrency } from '../../../src/lib/utils/currency'

export default function BudgetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { COLORS, spacing } = useTheme()
  const { budget, forecast, isLoading, pauseBudget, resumeBudget, deleteBudget } = useBudgetDetail(id || '')

  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false)

  if (isLoading || !budget) {
    return (
      <Screen scrollable={false} style={{ paddingHorizontal: spacing[6] }}>
        <Text>Loading...</Text>
      </Screen>
    )
  }

  const isActive = budget.status === 'ACTIVE'
  const isPaused = budget.status === 'PAUSED'

  const handlePauseToggle = async () => {
    if (isActive) {
      await pauseBudget()
    } else if (isPaused) {
      await resumeBudget()
    }
  }

  const handleDelete = async () => {
    await deleteBudget()
    setDeleteSheetVisible(false)
    router.back()
  }

  return (
    <Screen scrollable={true} style={{ paddingHorizontal: spacing[6], paddingTop: spacing[4] }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text variant="h2" color={COLORS.text.primary} style={{ flex: 1 }} numberOfLines={1}>
          {budget.name}
        </Text>
      </View>

      <View style={{ marginTop: spacing[6], marginBottom: spacing[8] }}>
        <BudgetRing budget={budget} />
      </View>

      {isActive && forecast && (
        <View style={{ marginBottom: spacing[8] }}>
          <Text variant="h3" color={COLORS.text.primary} style={{ marginBottom: spacing[4] }}>
            Forecast
          </Text>
          <Card variant="default" padding={4}>
            <View style={styles.forecastRow}>
              <View style={styles.forecastItem}>
                <Text variant="caption" color={COLORS.text.secondary}>Projected Spend</Text>
                <Text variant="body" color={COLORS.text.primary} style={{ fontFamily: 'DMMono-Medium', marginTop: 4 }}>
                  {formatCurrency(forecast.projectedSpend, budget.currency)}
                </Text>
              </View>
              <View style={styles.forecastItem}>
                <Text variant="caption" color={COLORS.text.secondary}>Daily Left</Text>
                <Text variant="body" color={COLORS.text.primary} style={{ fontFamily: 'DMMono-Medium', marginTop: 4 }}>
                  {formatCurrency(forecast.dailyBudgetLeft, budget.currency)}
                </Text>
              </View>
              <View style={styles.forecastItem}>
                <Text variant="caption" color={COLORS.text.secondary}>Days Left</Text>
                <Text variant="body" color={COLORS.text.primary} style={{ fontFamily: 'DMMono-Medium', marginTop: 4 }}>
                  {forecast.daysRemaining}
                </Text>
              </View>
            </View>
          </Card>
        </View>
      )}

      <View style={{ marginBottom: spacing[8] }}>
        <Text variant="h3" color={COLORS.text.primary} style={{ marginBottom: spacing[4] }}>
          Category Breakdown
        </Text>
        {budget.categories.map((c) => (
          <CategoryBar 
            key={c.id} 
            categoryBudget={c} 
            currency={budget.currency} 
            onPress={(cat) => router.push({ pathname: '/(app)/(tabs)/transactions', params: { category: cat } })}
          />
        ))}
      </View>

      <View style={{ marginBottom: spacing[8], gap: spacing[4] }}>
        {(isActive || isPaused) && (
          <Button variant="ghost" onPress={handlePauseToggle}>
            {isActive ? 'Pause Budget' : 'Resume Budget'}
          </Button>
        )}
        <Button variant="danger" onPress={() => setDeleteSheetVisible(true)}>
          Delete Budget
        </Button>
      </View>

      <BottomSheet
        visible={deleteSheetVisible}
        onClose={() => setDeleteSheetVisible(false)}
        title="Delete Budget?"
        snapPoints={[250]}
      >
        <View style={{ paddingHorizontal: spacing[4], gap: spacing[4] }}>
          <Text variant="body" color={COLORS.text.secondary}>
            Are you sure you want to delete this budget? This action cannot be undone.
          </Text>
          <View style={{ gap: spacing[3] }}>
            <Button variant="danger" onPress={handleDelete}>
              Yes, delete
            </Button>
            <Button variant="ghost" onPress={() => setDeleteSheetVisible(false)}>
              Cancel
            </Button>
          </View>
        </View>
      </BottomSheet>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forecastItem: {
    flex: 1,
  },
})
