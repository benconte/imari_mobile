/**
 * Imari profile, device, and KYC types.
 * Aligned with backend /identity/* endpoints.
 */

export interface UpdateProfilePayload {
  firstName?: string
  lastName?: string
  dateOfBirth?: string          // ISO datetime string
  profilePhotoUrl?: string
  preferredCurrency?: 'RWF' | 'USD' | 'EUR' | 'KES' | 'UGX' | 'TZS'
  preferredLanguage?: string
}

export interface UserProfile {
  id: string
  email: string
  phone: string
  firstName: string
  lastName: string
  dateOfBirth?: string | null
  profilePhotoUrl: string | null
  status: string
  kycStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED'
  kycTier: string
  isEmailVerified: boolean
  isPhoneVerified: boolean
  isMfaEnabled: boolean
  preferredCurrency: string
  preferredLanguage?: string
  referralCode?: string
  lastLoginAt?: string | null
  createdAt: string
}

export interface UserDevice {
  id: string
  deviceId: string
  deviceName: string
  deviceType: 'IOS' | 'ANDROID' | 'WEB'
  platform: string
  osVersion?: string
  appVersion?: string
  isTrusted: boolean
  lastSeenAt: string | null
  registeredAt: string
  /** Derived on frontend — true if this device's deviceId matches stored DEVICE_ID */
  isCurrent?: boolean
}

export type KYCDocumentType = 'NATIONAL_ID' | 'PASSPORT' | 'DRIVERS_LICENSE'

/**
 * Payload sent to POST /identity/kyc
 * documentFrontUrl: must be a valid URL.
 * NOTE: Real file upload (S3 pre-signed URL) is NOT yet implemented on the backend.
 * For now a hardcoded placeholder URL is submitted. Wire up the real upload here
 * once the backend adds POST /identity/kyc/upload-url.
 * TODO: Implement real file upload — Session 12/Polish or dedicated upload session.
 */
export interface KYCSubmitPayload {
  documentType: KYCDocumentType
  documentNumber: string
  documentFrontUrl: string       // placeholder until real upload is wired
  documentBackUrl?: string
  selfieUrl?: string             // placeholder until real upload is wired
}

/**
 * Local state held during the KYC capture flow.
 * localUri — the on-device image URI captured by camera/gallery.
 * remoteUrl — will be set once upload is implemented; currently set to placeholder.
 */
export interface KYCCapturedImage {
  localUri: string
  remoteUrl: string              // TODO: set from upload response
}
