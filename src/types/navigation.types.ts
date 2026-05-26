/**
 * Imari navigation types.
 * Route param definitions for typed navigation.
 */

export type AuthStackParams = {
  login: undefined
  register: undefined
  'verify-otp': {
    target: string
    purpose: 'REGISTRATION' | 'LOGIN' | 'RESET_PASSWORD' | 'TRANSACTION'
  }
}

export type AppTabsParams = {
  home: undefined
  transactions: undefined
  savings: undefined
  cards: undefined
  analytics: undefined
}

export type AppDrawerParams = {
  '(tabs)': undefined
  budget: undefined
  subscriptions: undefined
  notifications: undefined
  profile: undefined
}
