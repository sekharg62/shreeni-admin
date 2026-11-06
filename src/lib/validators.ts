/**
 * Field checks used by forms (they mirror the backend DTO rules).
 * Each returns an error message, or undefined when the value is valid.
 */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export const rules = {
  required: (v: unknown, label = 'This field') =>
    v === undefined || v === null || String(v).trim() === '' ? `${label} is required` : undefined,

  maxLength: (v: string, max: number, label = 'This field') =>
    v && v.length > max ? `${label} must be at most ${max} characters` : undefined,

  /** Optional slug: empty is fine (backend generates one). */
  slug: (v: string) =>
    v && !SLUG_REGEX.test(v) ? 'Use lowercase letters, numbers and hyphens (e.g. "mul-cotton")' : undefined,

  /** Optional hex color. */
  hexColor: (v: string) => (v && !HEX_COLOR_REGEX.test(v) ? 'Use a hex color like #b88646' : undefined),
}

/** Collect the first error per field, dropping fields without errors. */
export function collectErrors<K extends string>(
  checks: Record<K, (string | undefined)[]>,
): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {}
  for (const key of Object.keys(checks) as K[]) {
    const first = checks[key].find(Boolean)
    if (first) out[key] = first
  }
  return out
}

/** "Banarasi Silk!" → "banarasi-silk" (same rule as the backend). */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
