/**
 * Imari user-profile types.
 * The core User shape is in auth.types.ts — this file extends it with
 * profile-specific response types.
 */

export type { User } from './auth.types'

export interface UpdateProfilePayload {
  firstName?: string
  lastName?: string
  preferredCurrency?: string
}

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface PaginatedApiResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}
