// Categorical palette — validated CVD-safe (see dataviz validator).
// Assign in fixed order; never cycle. A legend/labels must always be present.
export const SERIES_COLORS = [
  '#2563eb',
  '#f59e0b',
  '#10b981',
  '#8b5cf6',
  '#ec4899',
] as const

// Status colors — reserved for polarity/state, never reused as a "series".
export const POSITIVE = '#16a34a' // green-600
export const NEGATIVE = '#dc2626' // red-600

export const AXIS_COLOR = '#9ca3af' // gray-400 (recessive)
export const GRID_COLOR = '#f3f4f6' // gray-100 (recessive)
export const INK = '#374151' // gray-700 (text)
