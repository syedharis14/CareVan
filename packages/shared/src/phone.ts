/**
 * Normalize a Pakistani mobile number to canonical `+923XXXXXXXXX` form.
 * Accepts `0300 1234567`, `0300-1234567`, `923001234567`, `+923001234567`.
 * Returns the cleaned input unchanged if it doesn't match a known shape —
 * schema validation (PkPhoneSchema) is responsible for rejecting it.
 */
export function normalizePkPhone(raw: string): string {
  const digits = raw.replace(/[\s()-]/g, '');
  if (/^03\d{9}$/.test(digits)) return `+92${digits.slice(1)}`;
  if (/^923\d{9}$/.test(digits)) return `+${digits}`;
  return digits;
}
