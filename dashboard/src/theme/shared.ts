import * as stylex from "@stylexjs/stylex";
import { colors, effects, fonts, radii } from "./tokens.stylex";

// Cross-component StyleX styles. Anything used by a single component belongs
// next to that component; only genuinely shared pieces (cards, form fields,
// buttons, banners, dialogs) live here.

/** Cards — the surface-card lift above the content window. */
export const card = stylex.create({
  base: {
    borderColor: colors.hairline,
    borderStyle: "solid",
    borderWidth: "1px",
    borderRadius: radii.lg,
    padding: "1rem 1.1rem",
    backgroundColor: colors.surfaceCard,
    boxShadow: effects.edgeHighlight,
  },
  // The Lark-app binding card auto-saves on change, so it has no bottom button
  // row to give it rhythm — add symmetric vertical room around the field.
  binding: {
    padding: "1.1rem",
  },
  // Stacked cards on the app pages (binding card + settings/routing cards)
  // need breathing room between them; apply to every card after the first.
  stacked: {
    marginTop: "0.85rem",
  },
});

/** Base UI Field rows: label + control on one line, error beneath the control. */
export const field = stylex.create({
  row: {
    display: "grid",
    gridTemplateColumns: {
      default: "14rem 1fr",
      "@media (max-width: 767px)": "1fr",
    },
    gap: "0.3rem 0.6rem",
    alignItems: "center",
    fontSize: "0.82rem",
    color: colors.ink,
  },
  label: {
    fontSize: "0.82rem",
    color: colors.body,
  },
  input: {
    font: "inherit",
    fontSize: "0.85rem",
    padding: "0.4rem 0.6rem",
    borderColor: {
      default: colors.hairlineStrong,
      ":focus-visible": colors.hairlineStrong,
    },
    borderStyle: "solid",
    borderWidth: "1px",
    borderRadius: radii.md,
    backgroundColor: colors.canvasSoft,
    color: colors.ink,
    minWidth: 0,
    outline: { default: null, ":focus-visible": "none", ":focus": "none" },
    boxShadow: {
      default: null,
      ":focus-visible": effects.focusRing,
      ":focus": effects.focusRing,
    },
    transitionProperty: "border-color, box-shadow",
    transitionDuration: "0.15s",
  },
  inputInvalid: {
    borderColor: colors.error,
  },
  inputReadonly: {
    backgroundColor: colors.canvas,
    color: colors.muted,
    cursor: "not-allowed",
  },
  error: {
    gridColumn: { default: "2", "@media (max-width: 767px)": "1" },
    fontSize: "0.78rem",
    color: colors.error,
  },
  required: {
    color: colors.error,
  },
  // A Select trigger doubling as a form input (the old "field-input
  // field-select"): pass to <Select trigger={[field.input, field.selectTrigger]}>.
  selectTrigger: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.4rem",
    width: "100%",
    cursor: "pointer",
  },
});

/** Buttons: neutral secondary (filter rows), action dispatch, primary CTA. */
export const button = stylex.create({
  secondary: {
    font: "inherit",
    fontSize: "0.82rem",
    fontWeight: 500,
    padding: "0.4rem 0.9rem",
    borderColor: { default: colors.hairlineStrong, ":hover": colors.mutedSoft },
    borderStyle: "solid",
    borderWidth: "1px",
    borderRadius: radii.md,
    backgroundColor: colors.surfaceCard,
    color: colors.ink,
    cursor: { default: "pointer", ":disabled": "not-allowed" },
    opacity: { default: null, ":disabled": 0.45 },
    transitionProperty: "border-color, background-color",
    transitionDuration: "0.15s",
  },
  // Action dispatch — neutral secondary; flips to semantic on result.
  action: {
    font: "inherit",
    fontSize: "0.84rem",
    fontWeight: 500,
    padding: "0.38rem 0.95rem",
    borderColor: { default: colors.hairlineStrong, ":hover": colors.mutedSoft },
    borderStyle: "solid",
    borderWidth: "1px",
    borderRadius: radii.md,
    backgroundColor: colors.surfaceCard,
    color: colors.ink,
    cursor: { default: "pointer", ":disabled": "not-allowed" },
    minWidth: "4rem",
    opacity: { default: null, ":disabled": 0.5 },
    textDecoration: "none",
    transitionProperty: "border-color, background-color, color",
    transitionDuration: "0.15s",
  },
  actionOk: {
    color: colors.success,
    borderColor: `color-mix(in srgb, ${colors.success} 55%, transparent)`,
    backgroundColor: `color-mix(in srgb, ${colors.success} 8%, transparent)`,
  },
  actionError: {
    color: colors.error,
    borderColor: `color-mix(in srgb, ${colors.error} 55%, transparent)`,
    backgroundColor: `color-mix(in srgb, ${colors.error} 8%, transparent)`,
  },
  // The lavender primary CTA (save/login).
  primary: {
    font: "inherit",
    fontSize: "0.85rem",
    fontWeight: 500,
    padding: "0.5rem 1.2rem",
    borderColor: {
      default: colors.primary,
      ":hover": colors.primaryHover,
      ":active": colors.primaryActive,
    },
    borderStyle: "solid",
    borderWidth: "1px",
    borderRadius: radii.md,
    backgroundColor: {
      default: colors.primary,
      ":hover": colors.primaryHover,
      ":active": colors.primaryActive,
    },
    color: colors.onPrimary,
    cursor: { default: "pointer", ":disabled": "not-allowed" },
    opacity: { default: null, ":disabled": 0.5 },
    transform: { default: null, ":active": "translateY(1px)" },
    transitionProperty: "background-color, transform",
    transitionDuration: "0.15s, 0.06s",
  },
});

/** Filter rows (Events/Config/Setup/app tabs): inline controls + hints. */
export const filters = stylex.create({
  row: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
    fontSize: "0.84rem",
  },
  item: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  label: {
    color: colors.muted,
  },
});

export const text = stylex.create({
  help: {
    fontSize: "0.84rem",
    color: colors.muted,
    lineHeight: 1.55,
    margin: "0.25rem 0 1rem",
  },
  // Result line under an action card.
  resultOk: {
    marginTop: "0.55rem",
    fontSize: "0.8rem",
    color: colors.success,
  },
  resultError: {
    marginTop: "0.55rem",
    fontSize: "0.8rem",
    color: colors.error,
    wordBreak: "break-word",
  },
});

/** The persistent warning banner (open console, picker fallback). */
export const banner = stylex.create({
  warn: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexWrap: "wrap",
    padding: "0.7rem 1rem",
    borderColor: `color-mix(in srgb, ${colors.warning} 45%, transparent)`,
    borderStyle: "solid",
    borderWidth: "1px",
    backgroundColor: `color-mix(in srgb, ${colors.warning} 10%, transparent)`,
    borderRadius: radii.md,
    fontSize: "0.86rem",
    color: colors.ink,
  },
  top: {
    marginBottom: "1.5rem",
  },
  trailingAction: {
    marginLeft: "auto",
  },
});

/** Base UI AlertDialog (delete confirmations). */
export const dialog = stylex.create({
  backdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgb(0 0 0 / 0.55)",
    zIndex: 20,
  },
  popup: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: colors.surfacePop,
    color: colors.ink,
    borderColor: colors.hairlineStrong,
    borderStyle: "solid",
    borderWidth: "1px",
    borderRadius: radii.lg,
    padding: "1.35rem 1.5rem",
    maxWidth: "26rem",
    width: "calc(100vw - 2rem)",
    boxShadow: `${effects.edgeHighlight}, 0 16px 70px rgb(0 0 0 / 0.6)`,
    zIndex: 21,
  },
  title: {
    fontSize: "1.05rem",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    margin: "0 0 0.5rem",
  },
  desc: {
    fontSize: "0.85rem",
    color: colors.body,
    margin: "0 0 1.35rem",
    wordBreak: "break-word",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.5rem",
  },
});

/** Mono text — code surfaces and identifiers. */
export const mono = stylex.create({
  text: {
    fontFamily: fonts.mono,
  },
  inlineCode: {
    fontFamily: fonts.mono,
    fontSize: "0.8em",
    padding: "0.08rem 0.35rem",
    borderRadius: radii.xs,
    backgroundColor: colors.surfaceStrong,
    color: colors.ink,
  },
});
