/**
 * KYC Step 2 — Selfie capture.
 *
 * Front camera with circular face guide overlay.
 * After capture: preview → submit KYC → success state → kyc-pending.
 *
 * NOTE: selfieUrl is currently a hardcoded placeholder URL.
 * TODO: Replace with real S3 upload once backend adds upload endpoint.
 */

import React, { useRef, useState } from 'react'
import {
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import * as Haptics from 'expo-haptics'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated'
import { router, useLocalSearchParams } from 'expo-router'
import { useTheme } from '../../../src/hooks/useTheme'
import { useKYC, KYC_PLACEHOLDER_URL } from '../../../src/hooks/useKYC'
import { Text } from '../../../src/components/ui/Text'
import { Button } from '../../../src/components/ui/Button'
import { Screen } from '../../../src/components/layout/Screen'
import type { KYCDocumentType, KYCCapturedImage } from '../../../src/types/profile.types'

type Phase = 'camera' | 'preview' | 'success'

function SuccessCheckmark() {
  const { COLORS, spacing } = useTheme()
  const scale = useSharedValue(0)
  const opacity = useSharedValue(0)

  React.useEffect(() => {
    scale.value = withDelay(100, withTiming(1, { duration: 400 }))
    opacity.value = withDelay(100, withTiming(1, { duration: 300 }))
  }, [])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={[animStyle, styles.checkmarkWrap]}>
      <View
        style={[
          styles.checkmarkCircle,
          { backgroundColor: COLORS.status.successMuted, borderColor: COLORS.status.success },
        ]}
      >
        <Text variant="display" color={COLORS.status.success}>✓</Text>
      </View>
    </Animated.View>
  )
}

export default function KYCSelfieScreen() {
  const { COLORS, spacing, radius } = useTheme()
  const params = useLocalSearchParams<{
    documentType: KYCDocumentType
    documentNumber: string
    documentFrontUrl: string
  }>()

  const { submitKyc, isSubmitting } = useKYC()
  const cameraRef = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [phase, setPhase] = useState<Phase>('camera')
  const [selfieCaptured, setSelfieCaptured] = useState<KYCCapturedImage | null>(null)

  // Breathing animation on the circular guide
  const breathScale = useSharedValue(1)
  React.useEffect(() => {
    breathScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1200 }),
        withTiming(1.0, { duration: 1200 }),
      ),
      -1,
    )
  }, [])
  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }))

  const handleCapture = async () => {
    if (!cameraRef.current) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 })
      if (photo?.uri) {
        setSelfieCaptured({ localUri: photo.uri, remoteUrl: KYC_PLACEHOLDER_URL })
        setPhase('preview')
      }
    } catch {
      // stay on camera
    }
  }

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    })
    if (!result.canceled && result.assets[0]) {
      setSelfieCaptured({
        localUri: result.assets[0].uri,
        remoteUrl: KYC_PLACEHOLDER_URL,
      })
      setPhase('preview')
    }
  }

  const handleSubmit = async () => {
    if (!selfieCaptured) return
    try {
      await submitKyc({
        documentType: params.documentType,
        documentNumber: params.documentNumber,
        documentFrontUrl: params.documentFrontUrl,
        selfieUrl: selfieCaptured.remoteUrl,
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setPhase('success')
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Submission failed. Please try again.'
      Alert.alert('Submission Failed', msg)
    }
  }

  // ── Success state ────────────────────────────────────────────────────────────
  if (phase === 'success') {
    return (
      <Screen style={{ paddingHorizontal: spacing[6], justifyContent: 'center', alignItems: 'center' }}>
        <SuccessCheckmark />
        <Text variant="h1" color={COLORS.text.primary} style={{ textAlign: 'center', marginTop: spacing[6] }}>
          Documents Submitted
        </Text>
        <Text
          variant="body"
          color={COLORS.text.secondary}
          style={{ textAlign: 'center', marginTop: spacing[3], marginBottom: spacing[10] }}
        >
          We'll verify your identity within 1–2 business days.{'\n'}
          You'll receive a notification when it's done.
        </Text>
        <Button
          fullWidth
          size="lg"
          onPress={() => router.replace('/(app)/kyc-pending' as never)}
          accessibilityLabel="Back to home"
        >
          Continue
        </Button>
      </Screen>
    )
  }

  // ── Preview state ─────────────────────────────────────────────────────────────
  if (phase === 'preview' && selfieCaptured) {
    return (
      <View style={styles.fill}>
        <Image source={{ uri: selfieCaptured.localUri }} style={styles.fill} resizeMode="cover" />
        <View style={[styles.previewActions, { paddingBottom: spacing[12], paddingHorizontal: spacing[6] }]}>
          <Text variant="label" color="#FFFFFF" style={{ textAlign: 'center', marginBottom: spacing[4] }}>
            Does your face look clear and well-lit?
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing[3] }}>
            <Button
              variant="secondary"
              style={{ flex: 1 }}
              onPress={() => { setSelfieCaptured(null); setPhase('camera') }}
              accessibilityLabel="Retake selfie"
            >
              Retake
            </Button>
            <Button
              style={{ flex: 1 }}
              loading={isSubmitting}
              onPress={handleSubmit}
              accessibilityLabel="Submit KYC"
            >
              Submit
            </Button>
          </View>
        </View>
      </View>
    )
  }

  // ── Permission denied ─────────────────────────────────────────────────────────
  if (permission && !permission.granted) {
    return (
      <Screen style={{ paddingHorizontal: spacing[6], justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="h2" color={COLORS.text.primary} style={{ textAlign: 'center', marginBottom: spacing[3] }}>
          Camera Access Required
        </Text>
        <Text variant="body" color={COLORS.text.secondary} style={{ textAlign: 'center', marginBottom: spacing[6] }}>
          Allow camera access to take your selfie.
        </Text>
        <Button fullWidth onPress={() => Linking.openSettings()}>Open Settings</Button>
        <Button fullWidth variant="ghost" onPress={handleGallery} style={{ marginTop: spacing[3] }}>
          Choose from Gallery
        </Button>
      </Screen>
    )
  }

  // ── Camera ─────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.fill}>
      {!permission?.granted ? (
        <Pressable
          style={styles.fill}
          onPress={async () => { await requestPermission() }}
        >
          <View style={[styles.fill, { backgroundColor: COLORS.background.primary, justifyContent: 'center', alignItems: 'center' }]}>
            <Text variant="body" color={COLORS.text.secondary}>Tap to grant camera permission</Text>
          </View>
        </Pressable>
      ) : (
        <CameraView ref={cameraRef} style={styles.fill} facing="front">
          {/* Header */}
          <View style={[styles.header, { paddingTop: spacing[12], paddingHorizontal: spacing[6] }]}>
            <Pressable onPress={() => router.back()} accessibilityRole="button">
              <Text variant="label" color="#FFFFFF">← Back</Text>
            </Pressable>
            <Text variant="label" color="#FFFFFF">Selfie • Step 3 of 3</Text>
          </View>

          {/* Circular guide overlay */}
          <View style={styles.circleOverlayContainer} pointerEvents="none">
            <Animated.View
              style={[
                breathStyle,
                styles.circleGuide,
                { borderColor: COLORS.accent.primary },
              ]}
            />
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text variant="bodySmall" color="#FFFFFF" style={{ textAlign: 'center' }}>
              Position your face within the circle
            </Text>
            <Text variant="caption" color="rgba(255,255,255,0.7)" style={{ textAlign: 'center', marginTop: 4 }}>
              Look directly at the camera · Ensure your face is well lit
            </Text>
          </View>

          {/* Controls */}
          <View style={[styles.cameraControls, { paddingBottom: spacing[12] }]}>
            <Pressable
              onPress={handleGallery}
              style={[styles.controlBtn, { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.full }]}
              accessibilityLabel="Choose from gallery"
            >
              <Text variant="bodySmall" color="#FFFFFF">Gallery</Text>
            </Pressable>

            <Pressable
              onPress={handleCapture}
              style={styles.captureBtn}
              accessibilityLabel="Take selfie"
            >
              <View style={styles.captureBtnInner} />
            </Pressable>

            <View style={styles.controlBtn} />
          </View>
        </CameraView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  circleOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleGuide: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  instructions: {
    position: 'absolute',
    bottom: 180,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 32,
  },
  captureBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#DDE1F0',
  },
  controlBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  previewActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  checkmarkWrap: { alignItems: 'center' },
  checkmarkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
