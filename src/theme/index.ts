import { Platform } from 'react-native';

export const colors = {
  brand: '#0F766E',
  brandDark: '#115E59',
  brandLight: '#5EEAD4',
  brandSurface: '#CCFBF1',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',

  text: '#0F172A',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',

  danger: '#DC2626',
  dangerSurface: '#FEE2E2',
  warning: '#D97706',
  warningSurface: '#FEF3C7',
  success: '#16A34A',
  successSurface: '#DCFCE7',
  info: '#2563EB',
  infoSurface: '#DBEAFE',

  track: '#0F766E',
  trackPending: '#94A3B8',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const shadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 2 },
  default: {},
}) as object;

export const difficultyLabels: Record<Difficulty, string> = {
  facil: 'Fácil',
  media: 'Média',
  dificil: 'Difícil',
};

export const difficultyColors: Record<Difficulty, string> = {
  facil: colors.success,
  media: colors.warning,
  dificil: colors.danger,
};

export type Difficulty = 'facil' | 'media' | 'dificil';
