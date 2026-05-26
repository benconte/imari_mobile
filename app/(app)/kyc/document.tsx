/**
 * KYC Step 1 — Document capture.
 *
 * Phase 1: user enters document number (pre-filled with type from step 0).
 * Phase 2: camera opens with guide frame overlay. User captures or picks from gallery.
 * Phase 3: preview captured image — Retake or Use This Photo.
 *
 * NOTE: The captured image localUri is stored in state. When submitting, a
 * hardcoded placeholder URL is used as documentFrontUrl.
 * TODO: Replace KYC_PLACEHOLDER_URL with a real upload call once the backend
 *       adds POST /identity/kyc/upload-url (S3 pre-signed URL).
 */

import React, { useRef, useState } from 'react'
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams } from 'expo-router'
import { useTheme } from '../../../src/hooks/useTheme'
import { Text } from '../../../src/components/ui/Text'
import { Button } from '../../../src/components/ui/Button'
import { Input } from '../../../src/components/ui/Input'
import { Screen } from '../../../src/components/layout/Screen'
import { KYC_PLACEHOLDER_URL } from '../../../src/hooks/useKYC'
import type { KYCDocumentType, KYCCapturedImage } from '../../../src/types/profile.types'

type Phase = 'form' | 'camera' | 'preview'

const STEP_LABELS: Record<KYCDocumentType, string> = {
  NATIONAL_ID: 'National ID',
  PASSPORT: 'Passport',
  DRIVERS_LICENSE: "Driver's License",
}

export default function KYCDocumentScreen() {
  const { COLORS, spacing, radius } = useTheme()
  const params = useLocalSearchParams<{ documentType: KYCDocumentType }>()
  const documentType = params.documentType ?? 'NATIONAL_ID'

  const [phase, setPhase] = useState<Phase>('form')
  const [documentNumber, setDocumentNumber] = useState('')
  const [docNumError, setDocNumError] = useState<string | undefined>()
  const [torch, setTorch] = useState(false)
  const [captured, setCaptured] = useState<KYCCapturedImage | null>(null)

  const cameraRef = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()

  // ── Phase: form ─────────────────────────────────────────────────────────────
  const handleOpenCamera = async () => {
    if (!documentNumber.trim()) {
      setDocNumError('Document number is required')
      return
    }
    setDocNumError(undefined)

    if (!permission?.granted) {
      const result = await requestPermission()
      if (!result.granted) return
    }
    setPhase('camera')
  }

  // ── Phase: camera ────────────────────────────────────────────────────────────
  const handleCapture = async () => {
    if (!cameraRef.current) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 })
      if (photo?.uri) {
        // Store localUri; remoteUrl is placeholder until upload is implemented
        setCaptured({ localUri: photo.uri, remoteUrl: KYC_PLACEHOLDER_URL })
        setPhase('preview')
      }
    } catch {
      // Camera error — stay on camera
    }
  }

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    })
    if (!result.canceled && result.assets[0]) {
      setCaptured({
        localUri: result.assets[0].uri,
        remoteUrl: KYC_PLACEHOLDER_URL,
      })
      setPhase('preview')
    }
  }

  // ── Phase: preview ───────────────────────────────────────────────────────────
  const handleUsePhoto = () => {
    if (!captured) return
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    router.push({
      pathname: '/(app)/kyc/selfie',
      params: {
        documentType,
        documentNumber,
        documentFrontUrl: captured.remoteUrl,
      },
    } as never)
  }

  // ── Render: permission denied ────────────────────────────────────────────────
  if (phase === 'camera' && permission && !permission.granted) {
    return (
      <Screen style={{ paddingHorizontal: spacing[6], justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="h2" color={COLORS.text.primary} style={{ textAlign: 'center', marginBottom: spacing[3] }}>
          Camera Access Required
        </Text>
        <Text variant="body" color={COLORS.text.secondary} style={{ textAlign: 'center', marginBottom: spacing[6] }}>
          Imari needs camera access to capture your identity document.
        </Text>
        <Button fullWidth onPress={() => Linking.openSettings()} accessibilityLabel="Open settings">
          Open Settings
        </Button>
        <Button fullWidth variant="ghost" onPress={() => setPhase('form')} style={{ marginTop: spacing[3] }}>
          Go Back
        </Button>
      </Screen>
    )
  }

  // ── Render: preview ──────────────────────────────────────────────────────────
  if (phase === 'preview' && captured) {
    return (
      <View style={styles.fill}>
        <Image source={{ uri: captured.localUri }} style={styles.fill} resizeMode="cover" />
        {/* Dark overlay at bottom */}
        <View style={[styles.previewActions, { paddingBottom: spacing[12], paddingHorizontal: spacing[6], gap: spacing[3] }]}>
          <Text variant="label" color="#FFFFFF" style={{ textAlign: 'center', marginBottom: spacing[2] }}>
            Does this look clear and legible?
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing[3] }}>
            <Button
              variant="secondary"
              style={{ flex: 1 }}
              onPress={() => { setCaptured(null); setPhase('camera') }}
              accessibilityLabel="Retake photo"
            >
              Retake
            </Button>
            <Button
              style={{ flex: 1 }}
              onPress={handleUsePhoto}
              accessibilityLabel="Use this photo"
            >
              Use Photo
            </Button>
          </View>
        </View>
      </View>
    )
  }

  // ── Render: camera ───────────────────────────────────────────────────────────
  if (phase === 'camera') {
    return (
      <View style={styles.fill}>
        <CameraView
          ref={cameraRef}
          style={styles.fill}
          facing="back"
          enableTorch={torch}
        >
          {/* Dark overlay mask with rectangular cutout */}
          <View style={styles.overlay} pointerEvents="none">
            {/* Top mask */}
            <View style={[styles.mask, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
            {/* Middle row: left mask + frame + right mask */}
            <View style={styles.frameRow}>
              <View style={[styles.sideMask, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
              {/* Document frame */}
              <View style={styles.frame}>
                {/* Corner accents */}
                {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
                  <View
                    key={pos}
                    style={[
                      styles.corner,
                      styles[pos],
                      { borderColor: COLORS.accent.primary },
                    ]}
                  />
                ))}
              </View>
              <View style={[styles.sideMask, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
            </View>
            {/* Bottom mask */}
            <View style={[styles.mask, { backgroundColor: 'rgba(0,0,0,0.6)', flex: 1 }]}>
              <Text variant="bodySmall" color="#FFFFFF" style={{ textAlign: 'center', marginTop: 12 }}>
                Place your {STEP_LABELS[documentType]} within the frame
              </Text>
              <Text variant="caption" color="rgba(255,255,255,0.6)" style={{ textAlign: 'center', marginTop: 4 }}>
                Ensure good lighting · Avoid reflections
              </Text>
            </View>
          </View>
        </CameraView>

        {/* Camera controls */}
        <View style={[styles.cameraControls, { paddingBottom: spacing[12] }]}>
          {/* Gallery button */}
          <Pressable
            onPress={handleGallery}
            style={[styles.controlBtn, { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.full }]}
            accessibilityLabel="Choose from gallery"
          >
            <Text variant="bodySmall" color="#FFFFFF">Gallery</Text>
          </Pressable>

          {/* Capture button */}
          <Pressable
            onPress={handleCapture}
            style={styles.captureBtn}
            accessibilityLabel="Capture document"
          >
            <View style={styles.captureBtnInner} />
          </Pressable>

          {/* Torch toggle */}
          <Pressable
            onPress={() => setTorch((t) => !t)}
            style={[
              styles.controlBtn,
              {
                backgroundColor: torch
                  ? COLORS.accent.primaryMuted
                  : 'rgba(255,255,255,0.15)',
                borderRadius: radius.full,
              },
            ]}
            accessibilityLabel="Toggle flash"
          >
            <Text variant="bodySmall" color={torch ? COLORS.accent.primary : '#FFFFFF'}>
              {torch ? '⚡ On' : '⚡ Off'}
            </Text>
          </Pressable>
        </View>
      </View>
    )
  }

  // ── Render: form (default) ───────────────────────────────────────────────────
  return (
    <Screen scrollable style={{ paddingHorizontal: spacing[6] }}>
      <View style={{ paddingTop: spacing[6], marginBottom: spacing[6] }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={{ marginBottom: spacing[4] }}>
          <Text variant="body" color={COLORS.text.tertiary}>← Back</Text>
        </Pressable>
        <Text variant="h1" color={COLORS.text.primary}>Capture Document</Text>
        <Text variant="body" color={COLORS.text.secondary} style={{ marginTop: spacing[1] }}>
          {STEP_LABELS[documentType]} • Step 2 of 3
        </Text>
      </View>

      {/* Instruction card */}
      <View
        style={[
          styles.instructionCard,
          {
            backgroundColor: COLORS.accent.primaryMuted,
            borderRadius: radius.xl,
            padding: spacing[4],
            marginBottom: spacing[5],
          },
        ]}
      >
        <Text variant="label" color={COLORS.accent.primary}>Before you capture:</Text>
        {['Place document on a flat, dark surface', 'Ensure all text is readable', 'Avoid glare and shadows'].map((tip) => (
          <Text key={tip} variant="bodySmall" color={COLORS.text.secondary} style={{ marginTop: spacing[1] }}>
            · {tip}
          </Text>
        ))}
      </View>

      <Input
        label="Document Number"
        value={documentNumber}
        onChangeText={(t) => { setDocumentNumber(t); setDocNumError(undefined) }}
        error={docNumError}
        autoCapitalize="characters"
        placeholder="e.g. 1198900012345678"
        returnKeyType="done"
        onSubmitEditing={handleOpenCamera}
      />

      <Button
        fullWidth
        size="lg"
        onPress={handleOpenCamera}
        style={{ marginTop: spacing[6] }}
        accessibilityLabel="Open camera"
      >
        Open Camera
      </Button>

      <Button
        fullWidth
        variant="ghost"
        onPress={async () => {
          if (!documentNumber.trim()) { setDocNumError('Document number is required'); return }
          setDocNumError(undefined)
          await handleGallery()
        }}
        style={{ marginTop: spacing[2] }}
        accessibilityLabel="Choose from gallery instead"
      >
        Choose from Gallery
      </Button>
    </Screen>
  )
}

const FRAME_WIDTH = '88%'
const FRAME_HEIGHT = 200
const CORNER_SIZE = 20
const CORNER_WIDTH = 3

const styles = StyleSheet.create({
  fill: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject },
  mask: { width: '100%', height: 120 },
  frameRow: { flexDirection: 'row', height: FRAME_HEIGHT },
  sideMask: { width: '6%' },
  frame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    borderRadius: 8,
  },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: '#4F8EF7' },
  tl: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderTopLeftRadius: 4 },
  tr: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderTopRightRadius: 4 },
  bl: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderBottomLeftRadius: 4 },
  br: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderBottomRightRadius: 4 },
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
  },
  previewActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  instructionCard: {},
})
