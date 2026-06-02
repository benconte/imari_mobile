/**
 * Imari app constants.
 */

export const APP_NAME = 'Imari'
export const APP_VERSION = '1.0.0'

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.imari.app/api/v1'

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'imari_access_token',
  REFRESH_TOKEN: 'imari_refresh_token',
  USER: 'imari_user',
  THEME_OVERRIDE: 'imari_theme_override',
  /** Whether fingerprint/face unlock is enabled for app lock screen */
  BIOMETRICS_ENABLED: 'imari_biometrics_enabled',
  DEVICE_ID: 'imari_device_id',
  IS_PIN_SET_KEY: 'imari_is_pin_set',
  HAS_SEEN_ONBOARDING: 'imari_has_seen_onboarding',
} as const

export const OTP_RESEND_TIMEOUT_SECONDS = 60
export const API_TIMEOUT_MS = 10_000
export const QUERY_STALE_TIME_MS = 2 * 60 * 1000

// ── Deep link constants ────────────────────────────────────────────────────────
export const DEEP_LINK_SCHEME = 'imari'
export const DEEP_LINK_SCREENS = {
  TRANSFER: 'transfer',
  RECEIVE: 'receive',
  TRANSACTION: 'transaction',
  VAULT: 'vault',
} as const
