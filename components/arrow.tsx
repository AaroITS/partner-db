/* The ↗ character is drawn small inside its em box, so sizing it by font-size
   never quite matches the letters beside it. An SVG fills its box exactly, so
   it can be set to the cap height of the label and look like part of it. */
export function ArrowOut() {
  return (
    <svg
      viewBox="0 0 12 12"
      width="11"
      height="11"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M3.5 8.5L8.5 3.5" />
      <path d="M4.5 3.5H8.5V7.5" />
    </svg>
  )
}
