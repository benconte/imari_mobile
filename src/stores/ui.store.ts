import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

interface ToastState {
  toast: { message: string; variant: ToastVariant; visible: boolean } | null
  showToast: (config: { message: string; variant: ToastVariant; duration?: number }) => void
  hideToast: () => void
}

export const useUIStore = create<ToastState>((set) => ({
  toast: null,
  showToast: ({ message, variant, duration = 3000 }) => {
    set({ toast: { message, variant, visible: true } })
    setTimeout(() => set({ toast: null }), duration)
  },
  hideToast: () => set({ toast: null }),
}))
