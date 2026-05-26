/**
 * Top-up screen — stub (full implementation in Session 4)
 */
import { Screen } from '../../../src/components/layout/Screen'
import { Text } from '../../../src/components/ui/Text'
import { useTheme } from '../../../src/hooks/useTheme'

export default function TopUpScreen() {
  const { COLORS, spacing } = useTheme()
  return (
    <Screen style={{ paddingHorizontal: spacing[4], paddingTop: spacing[4] }}>
      <Text variant="h1" style={{ color: COLORS.text.primary }}>Top Up</Text>
      <Text variant="body" style={{ color: COLORS.text.secondary, marginTop: spacing[2] }}>
        Coming in Session 4
      </Text>
    </Screen>
  )
}
