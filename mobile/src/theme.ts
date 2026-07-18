/**
 * PitchPilot AI — Premium Dark Mobile Theme
 * Dark navy SaaS look with cyan/blue accents.
 */

export const colors = {
  background: '#081225',
  surface: '#0d1a2e',
  card: '#111c31',
  cardBorder: '#263654',
  cardBorderLight: '#3a4f75',

  textPrimary: '#e8efff',
  textSecondary: '#a8b3cf',
  textMuted: '#6b7a9c',

  cyan: '#35d7ff',
  blue: '#4f8cff',
  purple: '#9b7cff',
  pink: '#e86cff',

  success: '#42e6a4',
  warning: '#ffc107',
  danger: '#ff8f8f',

  gradientStart: '#4f8cff',
  gradientEnd: '#35d7ff',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  button: {
    shadowColor: '#4f8cff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  glow: {
    shadowColor: '#35d7ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const gradients = {
  primary: ['#4f8cff', '#35d7ff'] as const,
  purple: ['#9b7cff', '#4f8cff'] as const,
  success: ['#42e6a4', '#2bc4a0'] as const,
  danger: ['#ff8f8f', '#e06c6c'] as const,
  dark: ['#111c31', '#0d1a2e'] as const,
};
