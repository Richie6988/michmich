// ============================================================
// BARRY DESIGN SYSTEM — Graphic DNA
// ============================================================
// One source of truth for visual tokens.
// Reach for these instead of one-off colors / sizes / shadows.
//
// Naming: barry/<category>/<token>
// ============================================================

/**
 * BRAND COLORS — primary palette used in product UI.
 * Use Tailwind utility classes when possible; these mirror the tailwind config.
 */
export const COLORS = {
  // Primary brand
  brand: '#2563EB',          // barry-blue (Tailwind: barry-blue)
  brandDeep: '#1D4ED8',      // hover/pressed
  brandLight: '#DBEAFE',     // bg accents

  // Accent
  coral: '#F97316',          // barry-coral
  coralLight: '#FFEDD5',

  // Status
  success: '#10B981',        // barry-green
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',

  // Neutral / surface
  ink: '#1E293B',            // primary text
  inkDim: '#475569',         // secondary text
  muted: '#64748B',          // tertiary
  border: '#E2E8F0',
  surface: '#FFFFFF',
  canvas: '#FAFAFA',         // app background
  canvasTinted: '#F8FAFC',
} as const;

/**
 * AVATAR PALETTE — deterministic color picking. Same person = same color.
 */
export const AVATAR_PALETTE = [
  '#2563EB', '#F97316', '#10B981', '#8B5CF6',
  '#EF4444', '#EC4899', '#06B6D4', '#F59E0B',
];

/**
 * GRADIENTS — Barry uses gradients sparingly for hero/cta moments.
 */
export const GRADIENTS = {
  primary: 'bg-gradient-to-br from-barry-blue to-blue-700',
  primaryHero: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700',
  success: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
  warning: 'bg-gradient-to-br from-amber-500 to-orange-600',
  surface: 'bg-gradient-to-br from-slate-50 via-white to-blue-50',
} as const;

/**
 * SHADOWS — Barry uses soft, low-spread shadows. Avoid sharp drop shadows.
 */
export const SHADOWS = {
  card: 'shadow-sm',
  cardHover: 'hover:shadow-md',
  raised: 'shadow-md',
  cta: 'shadow-lg shadow-blue-500/20',
  ctaSuccess: 'shadow-lg shadow-emerald-500/20',
  modal: 'shadow-xl',
} as const;

/**
 * RADIUS — most rounded shapes use 16-24px. Avatars are full circle.
 * Convention:
 *   sm   = 8px   small chips, tags
 *   md   = 12px  inputs, secondary buttons
 *   lg   = 16px  cards
 *   xl   = 24px  modals, hero cards
 *   full = 9999  avatars, pills, FABs
 */
export const RADIUS = {
  sm: 'rounded-lg',     // 8
  md: 'rounded-xl',     // 12
  lg: 'rounded-2xl',    // 16
  xl: 'rounded-3xl',    // 24
  full: 'rounded-full',
} as const;

/**
 * COMPONENT CLASSES — pre-baked class combos.
 * Reuse these rather than inventing one-off styles.
 */
export const CLASSES = {
  // ===== CARDS =====
  card:        'bg-white rounded-2xl border border-slate-100',
  cardPad:     'bg-white rounded-2xl border border-slate-100 p-4',
  cardElev:    'bg-white rounded-2xl border border-slate-100 shadow-sm',
  cardCta:     'bg-gradient-to-br from-barry-blue to-blue-700 text-white rounded-2xl shadow-lg shadow-blue-500/20',

  // ===== BUTTONS =====
  btnPrimary:   'bg-barry-blue text-white font-semibold rounded-xl px-4 py-2.5 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40',
  btnPrimaryLg: 'bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold rounded-2xl px-6 py-3.5 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-40',
  btnSecondary: 'bg-white border-2 border-barry-blue text-barry-blue font-semibold rounded-xl px-4 py-2.5 hover:bg-blue-50 active:scale-95 transition-all',
  btnGhost:     'text-slate-700 font-medium rounded-xl px-3 py-2 hover:bg-slate-100 transition-colors',
  btnDanger:    'bg-rose-500 text-white font-semibold rounded-xl px-4 py-2.5 hover:bg-rose-600 active:scale-95 transition-all',

  // Icon-only round buttons (close, more, etc.)
  iconButton:    'w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors',
  iconButtonRev: 'w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm shadow-md hover:bg-white flex items-center justify-center transition-colors',

  // ===== INPUTS =====
  input:        'w-full bg-slate-50 rounded-xl px-3.5 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 transition-shadow',
  inputSm:      'w-full bg-slate-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200',

  // ===== CHIPS / BADGES =====
  chipMuted:   'inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full px-2.5 py-0.5',
  chipBlue:    'inline-flex items-center gap-1 bg-blue-50 text-barry-blue text-xs font-bold rounded-full px-2.5 py-0.5',
  chipEmerald: 'inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full px-2.5 py-0.5',
  chipAmber:   'inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full px-2.5 py-0.5',
  chipRose:    'inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full px-2.5 py-0.5',

  // Pill (smaller chip - uppercase status indicator)
  pill:         'inline-block text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5',
  pillBlue:     'inline-block text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 bg-blue-50 text-barry-blue',
  pillEmerald:  'inline-block text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 bg-emerald-50 text-emerald-700',

  // ===== MODAL / POPUP =====
  modalBackdrop: 'fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4',
  modalContent:  'bg-white w-full max-w-lg rounded-3xl max-h-[92vh] overflow-y-auto barry-scroll',
  modalContentLg: 'bg-white w-full max-w-2xl rounded-3xl max-h-[92vh] overflow-y-auto barry-scroll',

  // ===== SECTION HEADERS =====
  sectionHeader: 'flex items-center justify-between mb-2',
  sectionTitle:  'text-[11px] font-bold uppercase tracking-wider text-slate-500',
  blockTitle:    'font-display font-bold text-base text-slate-900',

  // ===== TYPE =====
  h1: 'font-display font-extrabold text-2xl text-slate-900 tracking-tight',
  h2: 'font-display font-bold text-xl text-slate-900 tracking-tight',
  h3: 'font-display font-bold text-lg text-slate-900',
  body: 'text-sm text-slate-700 leading-relaxed',
  micro: 'text-[11px] text-slate-500',
} as const;

/**
 * MOTION — animation timings & easings.
 * Barry favors snappy, sub-300ms transitions. Bouncy springs for the mascot only.
 */
export const MOTION = {
  durationFast: 150,
  durationStd: 200,
  durationSlow: 300,
  ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;
