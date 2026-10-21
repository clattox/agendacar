/**
 * Custom SVG icon components.
 *
 * LANDING (dark bg) — viewBox 0 0 40 40, render at h-10 w-10
 *   Style: white strokes + orange (#f97316) accents
 *   Exports: IconCalendarCheck, IconClockHands, IconCrossedTools,
 *            IconGrid2x2, IconPersonCar, IconBellCheck
 *
 * SYSTEM (light bg) — viewBox 0 0 24 24, render at h-4 w-4 / h-5 w-5
 *   Style: currentColor strokes (adapts to Tailwind text class) + orange accents
 *   Exports: IconWrench, IconCalendarDot, IconCheckRing, IconClockThin
 */

/* ── Shared constants ──────────────────────────────────────────────────────── */
const W  = 'white'
const O  = '#f97316'
const SW = 1.8

/* ─── 1. Agenda online 24/7 ─────────────────────────────────────────────── */
export function IconCalendarCheck({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      {/* Calendar frame */}
      <rect x="3" y="7" width="27" height="24" rx="2" stroke={W} strokeWidth={SW} />
      {/* Binding pegs */}
      <line x1="11" y1="4"  x2="11" y2="10" stroke={W} strokeWidth={SW} strokeLinecap="round" />
      <line x1="22" y1="4"  x2="22" y2="10" stroke={W} strokeWidth={SW} strokeLinecap="round" />
      {/* Header separator */}
      <line x1="3"  y1="14" x2="30" y2="14" stroke={W} strokeWidth={SW} />
      {/* Date dots — row 1 */}
      <circle cx="10" cy="19" r="1.3" fill={W} />
      <circle cx="17" cy="19" r="1.3" fill={W} />
      <circle cx="24" cy="19" r="1.3" fill={W} />
      {/* Date dots — row 2 */}
      <circle cx="10" cy="25" r="1.3" fill={W} />
      <circle cx="17" cy="25" r="1.3" fill={W} />
      {/* Orange check badge */}
      <circle cx="30" cy="30" r="8" fill={O} />
      <polyline
        points="26.5,30 29.5,33.5 34.5,26.5"
        stroke={W} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

/* ─── 2. Horarios flexibles ──────────────────────────────────────────────── */
export function IconClockHands({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      {/* Clock ring */}
      <circle cx="20" cy="20" r="16" stroke={W} strokeWidth={SW} />
      {/* Cardinal tick marks */}
      <line x1="20" y1="7"  x2="20" y2="10" stroke={W} strokeWidth={SW} strokeLinecap="round" />
      <line x1="33" y1="20" x2="30" y2="20" stroke={W} strokeWidth={SW} strokeLinecap="round" />
      <line x1="20" y1="33" x2="20" y2="30" stroke={W} strokeWidth={SW} strokeLinecap="round" />
      <line x1="7"  y1="20" x2="10" y2="20" stroke={W} strokeWidth={SW} strokeLinecap="round" />
      {/* Hour hand (~10 o'clock) — orange */}
      <line x1="20" y1="20" x2="13.5" y2="12.5" stroke={O} strokeWidth="2.3" strokeLinecap="round" />
      {/* Minute hand (~2 o'clock) — orange */}
      <line x1="20" y1="20" x2="26.5" y2="11"   stroke={O} strokeWidth="1.8" strokeLinecap="round" />
      {/* Center pivot */}
      <circle cx="20" cy="20" r="2" fill={O} />
    </svg>
  )
}

/* ─── 3. Servicios a medida ──────────────────────────────────────────────── */
export function IconCrossedTools({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      {/* ── Screwdriver: tip at upper-left, handle at lower-right ── */}
      {/* Flat-head tip (orange crossbar perpendicular to shaft) */}
      <line x1="3"  y1="11" x2="11" y2="3"  stroke={O} strokeWidth="2.5" strokeLinecap="round" />
      {/* Shaft */}
      <line x1="8.5" y1="8.5" x2="29" y2="29" stroke={W} strokeWidth="2.3" strokeLinecap="round" />
      {/* Handle block */}
      <path d="M28,28 L32,24 L36,28 L32,32 Z"
            stroke={W} strokeWidth={SW} strokeLinejoin="round" />

      {/* ── Wrench: head at upper-right, handle at lower-left ── */}
      {/* Handle */}
      <line x1="5" y1="35" x2="22" y2="18" stroke={W} strokeWidth="2.3" strokeLinecap="round" />
      {/* Open-end C-head (opening faces toward handle/SW) */}
      <path d="M31,5 L35,9 Q37,13 31,15 L25,9"
            stroke={W} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
      {/* Orange socket ring */}
      <circle cx="31" cy="10" r="3" stroke={O} strokeWidth="1.6" />
    </svg>
  )
}

/* ─── 4. Panel de control ────────────────────────────────────────────────── */
export function IconGrid2x2({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      {/* Top-left — white outline */}
      <rect x="3"  y="3"  width="15" height="15" rx="2" stroke={W} strokeWidth={SW} />
      {/* Top-right — orange filled */}
      <rect x="22" y="3"  width="15" height="15" rx="2" fill={O} />
      {/* Bottom-left — orange filled */}
      <rect x="3"  y="22" width="15" height="15" rx="2" fill={O} />
      {/* Bottom-right — white outline */}
      <rect x="22" y="22" width="15" height="15" rx="2" stroke={W} strokeWidth={SW} />
    </svg>
  )
}

/* ─── 5. Gestión de clientes ─────────────────────────────────────────────── */
export function IconPersonCar({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      {/* Person — left side */}
      <circle cx="10" cy="8" r="5" stroke={W} strokeWidth={SW} />
      <path d="M3 28 C3 21 6 17 10 17 C14 17 17 21 17 28"
            stroke={W} strokeWidth={SW} strokeLinecap="round" fill="none" />
      {/* Car — right side */}
      {/* Body */}
      <rect x="20" y="24" width="18" height="9" rx="1.5" stroke={W} strokeWidth={SW} />
      {/* Roof */}
      <path d="M24 24 L26 18 L34 18 L37 24"
            stroke={W} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Window */}
      <path d="M27 24 L28.5 20 L32.5 20 L34.5 24"
            stroke={W} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Wheels — orange */}
      <circle cx="25" cy="33" r="3" fill={O} />
      <circle cx="34" cy="33" r="3" fill={O} />
    </svg>
  )
}

/* ─── 6. Confirmaciones automáticas ─────────────────────────────────────── */
export function IconBellCheck({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      {/* Hanger */}
      <line x1="20" y1="3" x2="20" y2="7" stroke={W} strokeWidth={SW} strokeLinecap="round" />
      {/* Bell body */}
      <path d="M13 26 L10 29 L30 29 L27 26 L27 17 C27 11.5 23.8 7 20 7 C16.2 7 13 11.5 13 17 Z"
            stroke={W} strokeWidth={SW} strokeLinejoin="round" fill="none" />
      {/* Clapper */}
      <path d="M17 29 Q20 34 23 29"
            stroke={W} strokeWidth={SW} strokeLinecap="round" fill="none" />
      {/* Orange check badge */}
      <circle cx="30" cy="31" r="8" fill={O} />
      <polyline
        points="26.5,31 29.5,34.5 34.5,27.5"
        stroke={W} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SYSTEM ICONS — light-theme compatible
   viewBox 0 0 24 24 · stroke="currentColor" · orange (#f97316) accent fills
   Designed for h-4 w-4 (16 px) – h-5 w-5 (20 px) render sizes
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── Wrench — service cards, PASOS step 1, EmptyState ───────────────────── */
export function IconWrench({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* Handle */}
      <line x1="3" y1="21" x2="14" y2="10"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {/* C-head, opening toward handle */}
      <path d="M19 3 L21.5 5.5 Q23 8.5 19 10 L15 6"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* Orange bolt */}
      <circle cx="19" cy="6.5" r="2" fill={O} />
    </svg>
  )
}

/* ─── Calendar — PASOS step 2 ────────────────────────────────────────────── */
export function IconCalendarDot({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* Frame */}
      <rect x="2" y="4" width="18" height="17" rx="1.5"
            stroke="currentColor" strokeWidth="1.5" />
      {/* Binding pegs */}
      <line x1="7"  y1="2" x2="7"  y2="6"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="2" x2="14" y2="6"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Header line */}
      <line x1="2" y1="9" x2="20" y2="9"
            stroke="currentColor" strokeWidth="1.5" />
      {/* Date dots row 1 */}
      <circle cx="7"  cy="13" r="0.85" fill="currentColor" />
      <circle cx="11" cy="13" r="0.85" fill="currentColor" />
      <circle cx="15" cy="13" r="0.85" fill="currentColor" />
      {/* Date dots row 2 */}
      <circle cx="7" cy="17" r="0.85" fill="currentColor" />
      {/* Orange accent dot */}
      <circle cx="15" cy="17" r="1.6" fill={O} />
    </svg>
  )
}

/* ─── Check ring — PASOS step 3 ──────────────────────────────────────────── */
export function IconCheckRing({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* Ring */}
      <circle cx="12" cy="12" r="9"
              stroke="currentColor" strokeWidth="1.5" />
      {/* Orange checkmark */}
      <polyline points="8,12 11,15.5 16,9"
                stroke={O} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Clock — duration row ────────────────────────────────────────────────── */
export function IconClockThin({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* Ring */}
      <circle cx="12" cy="12" r="9"
              stroke="currentColor" strokeWidth="1.5" />
      {/* Hour hand ~10 o'clock */}
      <line x1="12" y1="12" x2="7.8" y2="7.8"
            stroke={O} strokeWidth="1.6" strokeLinecap="round" />
      {/* Minute hand ~2 o'clock */}
      <line x1="12" y1="12" x2="16.5" y2="7"
            stroke={O} strokeWidth="1.3" strokeLinecap="round" />
      {/* Center pivot */}
      <circle cx="12" cy="12" r="1.2" fill={O} />
    </svg>
  )
}
