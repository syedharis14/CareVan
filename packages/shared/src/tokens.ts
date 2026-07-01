/**
 * CareVan design tokens — the single source of truth for color, radius, type, and touch sizing.
 * Consumed by mobile (theme object) and admin (Tailwind theme / CSS variables).
 *
 * Non-negotiable rules:
 * - `danger` is reserved EXCLUSIVELY for SOS and overspeed. Never use it for validation errors,
 *   destructive buttons, or badges — style those with ink/primary instead.
 * - Status is never conveyed by color alone: always icon + label.
 * - All text must hit >= 4.5:1 contrast against its background.
 * - Elevation: subtle single shadow. No glassmorphism.
 */

export const colors = {
  /** Deep trust blue — headers, primary buttons, brand. */
  primary: '#0F4C81',
  /** Backgrounds, selected states. */
  primaryLight: '#E8F1F8',
  /** BOARDED/REACHED, safety-ok, "child is safe" — the emotional hero color. */
  safe: '#1B873F',
  /** Van en route / in-transit states, ETAs. */
  transit: '#E8A13D',
  /** SOS and overspeed ONLY. */
  danger: '#D64541',
  /** Primary text. */
  ink: '#1A2430',
  /** Secondary text. */
  inkSoft: '#5A6B7C',
  surface: '#FFFFFF',
  bg: '#F5F7FA',
} as const;

export const radii = {
  card: 12,
  button: 10,
} as const;

export const typography = {
  /** Latin-only in v1 (English + Roman Urdu copy). Use Noto Nastaliq Urdu if Urdu strings land. */
  fontFamily: 'Inter',
  /** Generous for sunlight legibility. */
  bodySize: 16,
  /** Driver-app primary actions: 18–20, semibold. */
  driverActionSizeMin: 18,
  driverActionSizeMax: 20,
} as const;

export const touch = {
  /** Minimum touch target (px) — one-handed use standing at a van door. */
  minTargetPx: 56,
} as const;

/** CSS custom properties for web (admin). Values mirror `colors`. */
export const cssVariables = {
  '--color-primary': colors.primary,
  '--color-primary-light': colors.primaryLight,
  '--color-safe': colors.safe,
  '--color-transit': colors.transit,
  '--color-danger': colors.danger,
  '--color-ink': colors.ink,
  '--color-ink-soft': colors.inkSoft,
  '--color-surface': colors.surface,
  '--color-bg': colors.bg,
} as const;
