/* Shared visual language for all three pages.

   High contrast, near-neutral, one saturated accent. Warm stone was tried and
   read as editorial rather than current; what makes an interface look modern
   is the distance between near-black text and a vivid accent, not the
   temperature of the greys. */

/* The only colour on the page, and only on things you can click or that are
   currently active. Never decorative.

   Sits at the midpoint of the gradient rather than at its blue end, so the
   links and active states read as the same colour as the rule under the
   header instead of a separate blue. */
export const ACCENT = "#4F46E5";
export const ACCENT_TEXT = "#4338CA"; // on white, meets contrast
export const ACCENT_WASH = "#F0F0FE"; // hover rows, active tints
export const ACCENT_START = "#2563EB"; // the blue end of the gradient
export const ACCENT_END = "#7C3AED"; // the violet end

/* The only gradient on the site, and only ever on a rule — never on a
   surface, text or a button, where it would read as decoration. */
export const ACCENT_GRADIENT = `linear-gradient(90deg, ${ACCENT_START} 0%, ${ACCENT_END} 100%)`;

/* Three neutrals. INK is near-black rather than mid-grey — that contrast is
   doing most of the work. */
export const INK = "#0A0A0B"; // headings, emphasis
export const BODY = "#3F3F46"; // paragraphs, most text
export const MUTED = "#71717A"; // counts, dates, secondary labels

export const BORDER = "#E4E4E7"; // every hairline on the site
export const CANVAS = "#FAFAFA"; // page background behind the cards
export const HEADER = "#0A0A0B"; // the header band

/* Deadline status. Carried by a left bar on the card and repeated in words,
   so it never depends on colour alone. */
export const GREEN = "#059669";
export const RED = "#DC2626";

/* A card: white, 8px radius, one hairline. No shadow and no hover animation.
   Separation comes from the canvas behind it. */
export const CARD = "rounded-lg border bg-white";

/* An outlined pill, for industry tags and for buttons. */
export const TAG = "rounded border px-2 py-0.5 text-[11px] font-medium";

export const BUTTON =
  "inline-flex items-center gap-1.5 rounded border px-2.5 py-1 " +
  "text-[11px] font-semibold transition-colors";

/* A scrolling panel. The max-height and overflow go on the card itself, so
   the scrollbar stays inside its border instead of running down the
   outside. */
export const SCROLL_PANEL =
  "lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto " +
  "[scrollbar-width:thin] [scrollbar-color:#D4D4D8_transparent]";
