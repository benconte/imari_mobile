/**
 * Imari authentication types.
 * These types are locked in Session 1 — do not change without updating all consumers.
 *
 * Session 3 update: aligned User with backend login response shape.
 *   - Added kycTier (returned by backend)
 *   - Added DeviceInfo for the device payload sent on login
 */

export type KYCTier = 'TIER_0' | 'TIER_1' | 'TIER_2' | 'TIER_3'
export type KYCStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED'
export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED'

export interface User {
  id: string
  email: string
  phone: string
  firstName: string
  lastName: string
  profilePhotoUrl: string | null
  // Backend returns kycTier on login response
  kycTier: KYCTier
  // These are available from profile queries — optional here since not in login response
  status?: UserStatus
  kycStatus?: KYCStatus
  isMfaEnabled: boolean
  preferredCurrency: string
  financialHealthScore?: number | null
  /**
   * Whether the user has set a wallet PIN.
   * This is USER-scoped (one PIN per user, not per wallet).
   * Backend stores in walletPin table keyed by userId.
   * TODO: backend team to return this in GET /identity/profile and login response.
   * Until then: managed locally in AuthProvider via setIsPinSet().
   */
  isPinSet: boolean
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/**
 * Device information sent to backend on login.
 * Backend uses this to create/update a UserDevice record.
 */
export interface DevicePayload {
  deviceId: string
  deviceName: string
  deviceType: 'IOS' | 'ANDROID' | 'WEB'
  platform: string
  osVersion?: string
  appVersion?: string
}

export interface LoginPayload {
  email: string
  password: string
  totpCode?: string
  device?: DevicePayload
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  referralCode?: string
}

export interface VerifyOtpPayload {
  target: string
  code: string
  purpose: 'EMAIL_VERIFY' | 'RESET_PASSWORD'
}

export interface AuthContextValue {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  /** Whether the user has set a wallet PIN (user-scoped, not per-wallet). */
  isPinSet: boolean
  /**
   * Whether the user has passed the local lock screen this session.
   * Reset to false on app restart (in-memory only — not persisted).
   */
  isLocallyVerified: boolean
  login(accessToken: string, refreshToken: string, user: User): Promise<void>
  logout(): Promise<void>
  setUser(user: User): void
  /** Call after PIN is successfully set or changed to update local state. */
  setIsPinSet(value: boolean): void
  /** Called from the lock screen after biometric/PIN verification succeeds. */
  setLocallyVerified(value: boolean): void
  /** Whether the user has seen the onboarding screen. */
  hasSeenOnboarding: boolean
  /** Call to set the onboarding flag and persist it. */
  setHasSeenOnboarding(value: boolean): void
}
