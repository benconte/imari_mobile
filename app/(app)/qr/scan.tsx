/**
 * QR Scan screen — stub (full implementation in Session 12)
 */
import { Screen } from '../../../src/components/layout/Screen'
import { Text } from '../../../src/components/ui/Text'
import { useTheme } from '../../../src/hooks/useTheme'

export default function QRScanScreen() {
  const { COLORS, spacing } = useTheme()
  return (
    <Screen style={{ paddingHorizontal: spacing[4], paddingTop: spacing[4] }}>
      <Text variant="h1" style={{ color: COLORS.text.primary }}>Scan QR</Text>
      <Text variant="body" style={{ color: COLORS.text.secondary, marginTop: spacing[2] }}>
        Camera scanner — coming in Session 12
      </Text>
    </Screen>
  )
}
