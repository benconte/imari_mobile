/**
 * Imari Budget Screen — skeleton (full implementation in Session 6)
 */

import { Screen } from '../../src/components/layout/Screen'
import { Text } from '../../src/components/ui/Text'
import { useTheme } from '../../src/hooks/useTheme'

export default function BudgetScreen() {
  const { COLORS, spacing } = useTheme()
  return (
    <Screen scrollable style={{ paddingHorizontal: spacing[6], paddingTop: spacing[4] }}>
      <Text variant="h1" color={COLORS.text.primary}>Budget</Text>
      <Text variant="body" color={COLORS.text.secondary} style={{ marginTop: spacing[2] }}>
        Budget tracker — coming in Session 6
      </Text>
    </Screen>
  )
}
