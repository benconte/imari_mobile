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
  BIOMETRICS_ENABLED: 'imari_biometrics_enabled',
  DEVICE_ID: 'imari_device_id',
} as const

export const OTP_RESEND_TIMEOUT_SECONDS = 60
export const API_TIMEOUT_MS = 10_000
export const QUERY_STALE_TIME_MS = 2 * 60 * 1000
