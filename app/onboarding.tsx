import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { FadeInRight, FadeOutLeft, Layout } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { Screen } from '../src/components/layout/Screen'
import { Text } from '../src/components/ui/Text'
import { Button } from '../src/components/ui/Button'
import { useAuth } from '../src/hooks/useAuth'
import { useTheme } from '../src/hooks/useTheme'

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Imari',
    description: 'Aesthetic finance and banking for the modern world. Manage your money with elegance.',
    icon: '✨',
  },
  {
    id: 'savings',
    title: 'Smart Savings Vaults',
    description: 'Reach your goals faster. Create vaults, set targets, and automate your savings with rules.',
    icon: '🏦',
  },
  {
    id: 'transfers',
    title: 'Instant P2P Transfers',
    description: 'Send and receive money to your friends and family instantly, anywhere, anytime.',
    icon: '💸',
  },
  {
    id: 'cards',
    title: 'Virtual Cards',
    description: 'Secure online spending. Create virtual cards instantly, freeze them anytime, and stay in control.',
    icon: '💳',
  },
]

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()
  const { setHasSeenOnboarding } = useAuth()
  const { COLORS, spacing } = useTheme()

  const step = ONBOARDING_STEPS[currentStep]
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1

  const handleNext = () => {
    if (isLastStep) {
      finishOnboarding()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const finishOnboarding = () => {
    setHasSeenOnboarding(true)
    // index.tsx routing will naturally kick in, or we can explicitly route:
    router.replace('/auth/login')
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          key={step.id}
          entering={FadeInRight.duration(400)}
          exiting={FadeOutLeft.duration(400)}
          layout={Layout.springify()}
          style={styles.slide}
        >
          <View style={[styles.iconContainer, { backgroundColor: COLORS.background.secondary }]}>
            <Text style={styles.iconText}>{step.icon}</Text>
          </View>
          
          <Text variant="h1" style={[styles.title, { textAlign: 'center' }]}>
            {step.title}
          </Text>
          
          <Text variant="body" color={COLORS.text.secondary} style={[styles.description, { textAlign: 'center' }]}>
            {step.description}
          </Text>
        </Animated.View>
      </View>

      {/* Footer Navigation */}
      <View style={[styles.footer, { paddingBottom: spacing[10] }]}>
        <View style={styles.dots}>
          {ONBOARDING_STEPS.map((_, index) => (
            <Animated.View
              key={index}
              layout={Layout.springify()}
              style={[
                styles.dot,
                {
                  backgroundColor: currentStep === index ? COLORS.accent.primary : COLORS.background.tertiary,
                  width: currentStep === index ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          {currentStep > 0 ? (
            <Button variant="ghost" onPress={handleBack} style={styles.skipBtn}>
              Back
            </Button>
          ) : (
            <Button variant="ghost" onPress={finishOnboarding} style={styles.skipBtn}>
              Skip
            </Button>
          )}

          <Button variant="primary" onPress={handleNext} style={styles.nextBtn}>
            {isLastStep ? 'Get Started' : 'Next'}
          </Button>
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  iconText: {
    fontSize: 60,
  },
  title: {
    marginBottom: 16,
  },
  description: {
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipBtn: {
    flex: 1,
  },
  skipPlaceholder: {
    flex: 1,
  },
  nextBtn: {
    flex: 1,
  },
})
