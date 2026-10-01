/* Shared visual language for all three pages.
   Change a value here and every page follows. */

/* Accent — pulled from the page background so the palette stays one family.
   Black was tried for buttons and tags and read as a different system
   intruding; everything on the page is violet, blue or grey. */
export const VIOLET = '#4A33A8' // fills, active states
export const VIOLET_TEXT = '#3A2E8C' // violet text on white, meets contrast

/* Card text. The background is dark, the cards are light, so these are the
   colours used *inside* cards only. */
export const INK = '#15131F' // headings
export const BODY = '#3A3850' // paragraphs
export const MUTED = '#8A8798' // country, dates, counts
export const LABEL = '#6B6880' // small uppercase labels
export const HAIRLINE = '#ECEAF2' // dividers inside a card
export const TAG_BORDER = '#C5C1D8' // outlined industry tags

/* Traffic-light colours for tender deadlines. Darkened from the originals so
   white text on them still passes contrast. */
export const GREEN = '#15803D'
export const RED = '#C02626'

/* Cards are fully opaque white. Translucency was tried and composites with
   the violet background, which turned every card grey. */
export const CARD =
  'rounded-[22px] bg-white ' +
  'shadow-[0_1px_2px_rgba(20,14,60,0.10),0_14px_34px_-14px_rgba(20,14,60,0.40)]'

export const CARD_HOVER =
  'transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 ' +
  'hover:shadow-[0_1px_2px_rgba(20,14,60,0.12),0_22px_46px_-16px_rgba(20,14,60,0.50)]'

/* An outlined pill: industry tags, and the Website / View buttons. The arrow
   on a button is what marks it as the action, since nothing is filled. */
export const TAG = `rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide`

export const BUTTON =
  'inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-1 ' +
  'text-[11px] font-semibold tracking-wide transition-colors hover:bg-[#F3F0FD]'

/* A scrolling panel: the max-height and overflow go on the card itself, not
   on a wrapper, so the scrollbar stays inside the rounded border instead of
   running down the outside of it. */
export const SCROLL_PANEL =
  'lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto ' +
  '[scrollbar-width:thin] [scrollbar-color:#C5C1D8_transparent]'
