import { colors, radii, touch, typography } from '@carevan/shared';

/**
 * The mobile theme is a thin re-export of the shared design tokens plus a few
 * RN-only conveniences (spacing scale, alpha helper). NEVER hardcode a hex value
 * in a screen or component — pull from here so mobile and admin stay in sync.
 */

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Turn a token hex (#RRGGBB) into an rgba() string — for scrims/shadows only. */
function withAlpha(hex: string, alpha: number): string {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const theme = {
  colors,
  radii,
  typography,
  touch,
  spacing,
  withAlpha,
  /** Single subtle card shadow (no glassmorphism). */
  cardShadow: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

export type Theme = typeof theme;
