/**
 * useAppReady — loads fonts and hides splash screen once ready.
 * Called from root _layout.tsx to keep it under 80 lines.
 */

import { useEffect } from 'react'
import * as SplashScreen from 'expo-splash-screen'
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans'
import {
  DMMono_400Regular,
  DMMono_500Medium,
} from '@expo-google-fonts/dm-mono'

// Prevent auto-hide; we control it manually
SplashScreen.preventAutoHideAsync()

export function useAppReady(): boolean {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    DMMono_400Regular,
    DMMono_500Medium,
  })

  const isReady = fontsLoaded || fontError !== null

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync()
    }
  }, [isReady])

  return isReady
}
