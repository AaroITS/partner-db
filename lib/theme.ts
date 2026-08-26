/* Shared visual language for both the partners and tenders pages.
   Change a value here and both pages follow. */

export const BLUE = '#0B5CFF' // cold electric blue
export const BLUE_DEEP = '#0740B8' // pressed / selected state
export const BLUE_TINT = 'rgba(11,92,255,0.10)' // faint wash for unticked boxes

// Traffic-light colours for tender deadlines.
export const GREEN = '#16A34A'
export const RED = '#DC2626'

// Frosted glass: a translucent fill plus a blur of what sits behind it.
// The inset white line along the top edge is the highlight that makes the
// panel read as a physical pane rather than a flat transparent rectangle.
export const GLASS =
  'rounded-3xl border border-white/60 bg-white/58 backdrop-blur-xl ' +
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_1px_2px_rgba(11,92,255,0.05),0_12px_32px_-14px_rgba(11,92,255,0.30)]'

export const GLASS_HOVER =
  'transition-[transform,box-shadow,background-color] duration-300 ' +
  'hover:-translate-y-0.5 hover:bg-white/72 ' +
  'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_2px_rgba(11,92,255,0.06),0_20px_44px_-16px_rgba(11,92,255,0.38)]'

// Same glass, minus the border — the tender card supplies its own coloured
// border so the deadline status is visible at a glance.
export const GLASS_NO_BORDER =
  'rounded-3xl bg-white/58 backdrop-blur-xl ' +
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_1px_2px_rgba(11,92,255,0.05),0_12px_32px_-14px_rgba(11,92,255,0.30)]'
