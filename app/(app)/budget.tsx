import React from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Screen } from '../../src/components/layout/Screen'
import { Text } from '../../src/components/ui/Text'
import { Button } from '../../src/components/ui/Button'
import { EmptyState } from '../../src/components/ui/EmptyState'
import { BudgetRing } from '../../src/components/budget/BudgetRing'
import { CategoryBar } from '../../src/components/budget/CategoryBar'
import { BudgetSummaryCard } from '../../src/components/budget/BudgetSummaryCard'
import { useBudget, useBudgetDetail } from '../../src/hooks/useBudget'
import { useTheme } from '../../src/hooks/useTheme'
import { SPENDING_CATEGORY_LABELS } from '../../src/types/transaction.types'

export default function BudgetScreen() {
  const { COLORS, spacing, radius } = useTheme()
  const router = useRouter()
  const { activeBudget, allBudgets, isLoading, refetch } = useBudget()

  const { forecast } = useBudgetDetail(activeBudget?.id || '')

  if (!isLoading && !activeBudget) {
    return (
      <Screen scrollable={false} style={{ paddingHorizontal: 0 }}>
        <View style={[styles.header, { paddingHorizontal: spacing[6], paddingTop: spacing[4] }]}>
          <Text variant="h1" color={COLORS.text.primary}>Budget</Text>
          <Button variant="ghost" size="sm" onPress={() => router.push('/(app)/budget/create')}>
            New
          </Button>
        </View>
        <EmptyState
          title="No active budget"
          description="Create a budget to track and control your spending"
          action={{ label: 'Create Budget', onPress: () => router.push('/(app)/budget/create') }}
        />
      </Screen>
    )
  }

  const warnings = forecast?.categoryForecasts.filter((f) => f.willExceed) || []
  
  const sortedCategories = activeBudget?.categories.slice().sort((a, b) => {
    const aExceeded = a.spent > a.limit
    const bExceeded = b.spent > b.limit
    if (aExceeded && !bExceeded) return -1
    if (!aExceeded && bExceeded) return 1
    const aApproaching = a.spent / a.limit >= a.alertAt
    const bApproaching = b.spent / b.limit >= b.alertAt
    if (aApproaching && !bApproaching) return -1
    if (!aApproaching && bApproaching) return 1
    return (b.spent / b.limit) - (a.spent / a.limit)
  }) || []

  const pastBudgets = allBudgets.filter((b) => b.id !== activeBudget?.id)

  const periodLabel = activeBudget 
    ? `${activeBudget.period.charAt(0).toUpperCase() + activeBudget.period.slice(1).toLowerCase()}` 
    : ''

  return (
    <Screen scrollable={true} onRefresh={refetch} refreshing={isLoading} style={{ paddingHorizontal: 0 }}>
      <View style={[styles.header, { paddingHorizontal: spacing[6], paddingTop: spacing[4] }]}>
        <View>
          <Text variant="h1" color={COLORS.text.primary}>Budget</Text>
          {activeBudget && (
            <Text variant="body" color={COLORS.text.secondary} style={{ marginTop: 2 }}>
              {periodLabel}
            </Text>
          )}
        </View>
        <Button variant="ghost" size="sm" onPress={() => router.push('/(app)/budget/create')}>
          New
        </Button>
      </View>

      <View style={{ marginTop: spacing[6], marginBottom: spacing[8] }}>
        <BudgetRing budget={activeBudget} isLoading={isLoading} />
      </View>

      {warnings.length > 0 && (
        <View style={{ marginBottom: spacing[8] }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing[6], gap: spacing[4] }}>
            {warnings.map((w, idx) => {
              const isExceeded = w.daysUntilExceed !== null && w.daysUntilExceed <= 0
              return (
                <View 
                  key={idx} 
                  style={[
                    styles.warningCard, 
                    { 
                      backgroundColor: isExceeded ? COLORS.status.errorMuted : COLORS.status.warningMuted,
                      borderRadius: radius.lg 
                    }
                  ]}
                >
                  <MaterialIcons 
                    name={isExceeded ? 'error-outline' : 'warning-amber'} 
                    size={24} 
                    color={isExceeded ? COLORS.status.error : COLORS.status.warning} 
                  />
                  <Text variant="body" color={COLORS.text.primary} style={{ flex: 1 }}>
                    {isExceeded 
                      ? `You've exceeded your ${SPENDING_CATEGORY_LABELS[w.category] || w.category} budget` 
                      : `At this rate you'll exceed ${SPENDING_CATEGORY_LABELS[w.category] || w.category} budget in ${w.daysUntilExceed} days`}
                  </Text>
                </View>
              )
            })}
          </ScrollView>
        </View>
      )}

      {sortedCategories.length > 0 && (
        <View style={{ paddingHorizontal: spacing[6], marginBottom: spacing[8] }}>
          <Text variant="h3" color={COLORS.text.primary} style={{ marginBottom: spacing[4] }}>
            Spending Breakdown
          </Text>
          {sortedCategories.map((c) => (
            <CategoryBar 
              key={c.id} 
              categoryBudget={c} 
              currency={activeBudget!.currency}
              onPress={(cat) => router.push({ pathname: '/(app)/(tabs)/transactions', params: { category: cat } })}
            />
          ))}
        </View>
      )}

      {pastBudgets.length > 0 && (
        <View style={{ paddingHorizontal: spacing[6], marginBottom: spacing[8] }}>
          <Text variant="h3" color={COLORS.text.primary} style={{ marginBottom: spacing[4] }}>
            Past Budgets
          </Text>
          {pastBudgets.map((b) => (
            <BudgetSummaryCard 
              key={b.id} 
              budget={b} 
              onPress={() => router.push(`/(app)/budget/${b.id}` as any)} 
            />
          ))}
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    width: 280,
    gap: 12,
  },
})
