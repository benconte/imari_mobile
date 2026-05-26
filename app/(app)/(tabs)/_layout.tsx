/**
 * Imari bottom tab navigator.
 * Uses custom floating TabBar component.
 */

import { Tabs } from 'expo-router'
import { TabBar } from '../../../src/components/navigation/TabBar'

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Transactions' }} />
      <Tabs.Screen name="savings" options={{ title: 'Savings' }} />
      <Tabs.Screen name="cards" options={{ title: 'Cards' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
    </Tabs>
  )
}
