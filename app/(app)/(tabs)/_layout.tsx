/**
 * Imari bottom tab navigator.
 * Uses custom floating TabBar component.
 */

import { Tabs } from 'expo-router'
import { TabBar } from '../../../src/components/navigation/TabBar'

import { Header } from '../../../src/components/layout/Header'

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: true,
        header: () => <Header />,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Transactions' }} />
      <Tabs.Screen name="savings" options={{ title: 'Savings' }} />
      <Tabs.Screen name="cards" options={{ title: 'Cards' }} />
      <Tabs.Screen name="wallet" options={{ title: 'Wallet' }} />
    </Tabs>
  )
}
