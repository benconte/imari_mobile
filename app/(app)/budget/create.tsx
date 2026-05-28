import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Screen } from '../../../src/components/layout/Screen'
import { Text } from '../../../src/components/ui/Text'
import { Button } from '../../../src/components/ui/Button'
import { Input } from '../../../src/components/ui/Input'
import { Chip } from '../../../src/components/ui/Chip'
import { StepIndicator } from '../../../src/components/ui/StepIndicator'
import { AmountInput } from '../../../src/components/ui/AmountInput'
import { BottomSheet } from '../../../src/components/ui/BottomSheet'
import { useBudget } from '../../../src/hooks/useBudget'
import { useTheme } from '../../../src/hooks/useTheme'
import { formatCurrency } from '../../../src/lib/utils/currency'
import { BudgetPeriod } from '../../../src/types/budget.types'
import { SpendingCategory, SPENDING_CATEGORY_LABELS } from '../../../src/types/transaction.types'

const STEPS = ['Basics', 'Limit', 'Allocate']
const SUGGESTIONS = [100000, 200000, 500000, 1000000]

export default function CreateBudgetScreen() {
  const router = useRouter()
  const { COLORS, spacing, radius } = useTheme()
  const { createBudget, isCreating } = useBudget()

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [period, setPeriod] = useState<BudgetPeriod>('MONTHLY')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [limit, setLimit] = useState('')
  
  const [allocations, setAllocations] = useState<{ category: SpendingCategory; amount: string }[]>([
    { category: 'FOOD_AND_DINING', amount: '' },
    { category: 'TRANSPORT', amount: '' },
    { category: 'SHOPPING', amount: '' },
  ])

  const [sheetVisible, setSheetVisible] = useState(false)

  const totalLimit = parseFloat(limit || '0')
  const totalAllocated = allocations.reduce((sum, a) => sum + parseFloat(a.amount || '0'), 0)
  const unallocated = totalLimit - totalAllocated

  const handleNext = () => setStep((s) => Math.min(s + 1, 2))
  const handleBack = () => setStep((s) => Math.max(s - 1, 0))

  const handleAutoAllocate = () => {
    if (allocations.length === 0) return
    const avg = totalLimit / allocations.length
    setAllocations(allocations.map(a => ({ ...a, amount: avg.toString() })))
  }

  const handleAddCategory = (cat: SpendingCategory) => {
    setAllocations([...allocations, { category: cat, amount: '' }])
    setSheetVisible(false)
  }

  const handleSubmit = async () => {
    if (unallocated !== 0) return
    await createBudget({
      name,
      period,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      totalLimit,
      currency: 'RWF',
      categories: allocations.map(a => ({ category: a.category, limit: parseFloat(a.amount || '0'), spent: 0, alertAt: 0.8 }))
    })
    router.replace('/(app)/budget')
  }

  const renderStep0 = () => (
    <View style={styles.stepContent}>
      <Input label="Budget name" value={name} onChangeText={setName} placeholder="e.g. December Budget" />
      <View style={{ marginTop: spacing[6], gap: spacing[4] }}>
        <Text variant="label" color={COLORS.text.secondary}>Period</Text>
        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
          {['WEEKLY', 'MONTHLY', 'CUSTOM'].map((p) => (
            <Chip 
              key={p} 
              label={p.charAt(0) + p.slice(1).toLowerCase()} 
              active={period === p} 
              onPress={() => setPeriod(p as BudgetPeriod)} 
            />
          ))}
        </View>
      </View>
      {period === 'CUSTOM' && (
        <View style={{ marginTop: spacing[6], gap: spacing[4] }}>
          <Input label="Start Date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} />
          <Input label="End Date (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} />
        </View>
      )}
    </View>
  )

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <AmountInput value={limit} onChange={setLimit} currency="RWF" label="Total budget limit" />
      <View style={{ alignItems: 'center', marginTop: spacing[4] }}>
        <Text variant="caption" color={COLORS.text.secondary} style={{ marginBottom: spacing[2] }}>
          Quick suggestions
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap', justifyContent: 'center' }}>
          {SUGGESTIONS.map(s => (
            <Chip key={s} label={formatCurrency(s, 'RWF')} onPress={() => setLimit(s.toString())} />
          ))}
        </View>
      </View>
    </View>
  )

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={{ alignItems: 'center', marginBottom: spacing[6] }}>
        <Text variant="h3" color={COLORS.text.primary}>Allocate your budget</Text>
        <Text variant="caption" color={unallocated === 0 ? COLORS.status.success : COLORS.text.secondary} style={{ marginTop: spacing[2] }}>
          {unallocated === 0 ? 'Fully allocated!' : `${formatCurrency(unallocated, 'RWF')} remaining`}
        </Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: spacing[4], paddingBottom: spacing[8] }}>
        {allocations.map((a, i) => (
          <View key={a.category} style={[styles.allocRow, { backgroundColor: COLORS.background.tertiary, borderRadius: radius.lg }]}>
            <Text variant="body" color={COLORS.text.primary} style={{ flex: 1 }}>{SPENDING_CATEGORY_LABELS[a.category]}</Text>
            <View style={{ width: 120 }}>
              <Input 
                label="Amount" 
                value={a.amount} 
                onChangeText={(val) => {
                  const newAlloc = [...allocations]
                  newAlloc[i].amount = val
                  setAllocations(newAlloc)
                }} 
                keyboardType="numeric" 
              />
            </View>
          </View>
        ))}
        <Button variant="ghost" onPress={() => setSheetVisible(true)}>+ Add category</Button>
      </ScrollView>
    </View>
  )

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Screen scrollable={false} style={{ paddingHorizontal: spacing[6], paddingTop: spacing[4] }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={step === 0 ? () => router.back() : handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1, paddingRight: 24 }}>
            <StepIndicator steps={STEPS} currentStep={step} />
          </View>
        </View>

        <View style={{ flex: 1, marginTop: spacing[8] }}>
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
        </View>

        <View style={{ paddingVertical: spacing[4], gap: spacing[3] }}>
          {step === 2 && <Button variant="secondary" onPress={handleAutoAllocate}>Auto-allocate evenly</Button>}
          <Button 
            onPress={step === 2 ? handleSubmit : handleNext} 
            loading={isCreating}
            disabled={
              (step === 0 && !name) || 
              (step === 1 && !limit) || 
              (step === 2 && unallocated !== 0)
            }
          >
            {step === 2 ? 'Create Budget' : 'Continue'}
          </Button>
        </View>

        <BottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} title="Select Category">
          <View style={{ padding: spacing[4], flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
            {Object.keys(SPENDING_CATEGORY_LABELS).map((c) => {
              const cat = c as SpendingCategory
              if (allocations.find(a => a.category === cat)) return null
              return <Chip key={cat} label={SPENDING_CATEGORY_LABELS[cat]} onPress={() => handleAddCategory(cat)} />
            })}
          </View>
        </BottomSheet>
      </Screen>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 4, marginLeft: -4 },
  stepContent: { flex: 1 },
  allocRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
})
