/**
 * Imari color palette — refined dark luxury aesthetic.
 * Primary: royal indigo #4F8EF7 | Secondary: warm gold #F0B429
 * Both light and dark objects MUST have identical keys.
 */

export interface ColorPalette {
  background: {
    primary: string
    secondary: string
    tertiary: string
    overlay: string
  }
  text: {
    primary: string
    secondary: string
    tertiary: string
    inverse: string
    accent: string
  }
  border: {
    default: string
    subtle: string
    focus: string
  }
  accent: {
    primary: string
    primaryHover: string
    primaryMuted: string
    primarySubtle: string
    secondary: string
    secondaryMuted: string
  }
  status: {
    success: string
    successMuted: string
    warning: string
    warningMuted: string
    error: string
    errorMuted: string
    info: string
    infoMuted: string
  }
  card: {
    background: string
    border: string
  }
  tab: {
    active: string
    inactive: string
    background: string
  }
  drawer: {
    background: string
    itemActive: string
    itemInactive: string
    itemActiveBg: string
  }
  chart: {
    line1: string
    line2: string
    bar1: string
    bar2: string
  }
}

export const lightColors: ColorPalette = {
  background: {
    primary: '#F8F9FC',
    secondary: '#FFFFFF',
    tertiary: '#EFF1F8',
    overlay: 'rgba(15, 20, 40, 0.55)',
  },
  text: {
    primary: '#0F1428',
    secondary: '#4A5070',
    tertiary: '#8891B0',
    inverse: '#FFFFFF',
    accent: '#2E74F5',
  },
  border: {
    default: '#DDE1F0',
    subtle: '#ECEEF8',
    focus: '#4F8EF7',
  },
  accent: {
    primary: '#4F8EF7',
    primaryHover: '#2E74F5',
    primaryMuted: 'rgba(79, 142, 247, 0.15)',
    primarySubtle: '#EBF2FF',
    secondary: '#F0B429',
    secondaryMuted: 'rgba(240, 180, 41, 0.15)',
  },
  status: {
    success: '#22A06B',
    successMuted: 'rgba(34, 160, 107, 0.12)',
    warning: '#D97706',
    warningMuted: 'rgba(217, 119, 6, 0.12)',
    error: '#DC3545',
    errorMuted: 'rgba(220, 53, 69, 0.12)',
    info: '#4F8EF7',
    infoMuted: 'rgba(79, 142, 247, 0.12)',
  },
  card: {
    background: '#FFFFFF',
    border: '#DDE1F0',
  },
  tab: {
    active: '#4F8EF7',
    inactive: '#8891B0',
    background: 'rgba(255, 255, 255, 0.9)',
  },
  drawer: {
    background: '#FFFFFF',
    itemActive: '#4F8EF7',
    itemInactive: '#4A5070',
    itemActiveBg: '#EBF2FF',
  },
  chart: {
    line1: '#4F8EF7',
    line2: '#F0B429',
    bar1: '#4F8EF7',
    bar2: 'rgba(79, 142, 247, 0.35)',
  },
}

export const darkColors: ColorPalette = {
  background: {
    primary: '#0D1117',
    secondary: '#161C2D',
    tertiary: '#1E2640',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  text: {
    primary: '#E8ECF7',
    secondary: '#8C9BBC',
    tertiary: '#4D5A7A',
    inverse: '#0D1117',
    accent: '#4F8EF7',
  },
  border: {
    default: '#252D45',
    subtle: '#1A2235',
    focus: '#4F8EF7',
  },
  accent: {
    primary: '#4F8EF7',
    primaryHover: '#2E74F5',
    primaryMuted: 'rgba(79, 142, 247, 0.15)',
    primarySubtle: 'rgba(79, 142, 247, 0.08)',
    secondary: '#F0B429',
    secondaryMuted: 'rgba(240, 180, 41, 0.15)',
  },
  status: {
    success: '#34D399',
    successMuted: 'rgba(52, 211, 153, 0.12)',
    warning: '#FBBF24',
    warningMuted: 'rgba(251, 191, 36, 0.12)',
    error: '#F87171',
    errorMuted: 'rgba(248, 113, 113, 0.12)',
    info: '#4F8EF7',
    infoMuted: 'rgba(79, 142, 247, 0.12)',
  },
  card: {
    background: '#161C2D',
    border: '#252D45',
  },
  tab: {
    active: '#4F8EF7',
    inactive: '#4D5A7A',
    background: 'rgba(22, 28, 45, 0.92)',
  },
  drawer: {
    background: '#0D1117',
    itemActive: '#4F8EF7',
    itemInactive: '#8C9BBC',
    itemActiveBg: 'rgba(79, 142, 247, 0.12)',
  },
  chart: {
    line1: '#4F8EF7',
    line2: '#F0B429',
    bar1: '#4F8EF7',
    bar2: 'rgba(79, 142, 247, 0.3)',
  },
}
