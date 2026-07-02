import { colors as brand, radii as brandRadii, touch } from '@carevan/shared';
import { TextStyle, ViewStyle } from 'react-native';

/**
 * CareVan mobile design system. Brand colors come from @carevan/shared (never hardcode
 * hex). This layer adds the Inter type scale, spacing, elevation, and a few derived
 * surfaces so screens compose from one consistent system.
 *
 * Rules that still hold: red (danger) = SOS/overspeed ONLY; status is icon + label,
 * never color alone; text contrast >= 4.5:1.
 */

export function withAlpha(hex: string, alpha: number): string {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const colors = {
  ...brand,
  /** Hairline borders / dividers. */
  border: '#E4E9F0',
  borderStrong: '#D2DAE6',
  /** Subtle fill behind icons / selected rows. */
  fill: '#EEF3F9',
  /** Scrim for modals. */
  overlay: withAlpha(brand.ink, 0.5),
} as const;

/** Inter families (loaded in App via @expo-google-fonts/inter). */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

/** Type scale — the single source for text styles (see ui/Text). */
export const type = {
  display: { fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 38 },
  h1: { fontFamily: fonts.extrabold, fontSize: 26, lineHeight: 32 },
  h2: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28 },
  title: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24 },
  bodyLg: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 25 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyMd: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  button: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 20 },
} satisfies Record<string, TextStyle>;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const radii = {
  sm: 8,
  md: brandRadii.button, // 10
  lg: brandRadii.card, // 12
  xl: 18,
  xxl: 24,
  pill: 999,
} as const;

export const elevation = {
  sm: {
    shadowColor: brand.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  } satisfies ViewStyle,
  md: {
    shadowColor: brand.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  } satisfies ViewStyle,
  lg: {
    shadowColor: brand.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  } satisfies ViewStyle,
} as const;

export const theme = {
  colors,
  fonts,
  type,
  spacing,
  radii,
  elevation,
  touch,
  withAlpha,
} as const;

export type Theme = typeof theme;
