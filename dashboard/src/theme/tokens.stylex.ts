import * as stylex from "@stylexjs/stylex";

// The Linear design language (see /DESIGN.md): near-black canvas, a surface
// ladder + hairlines for depth, lavender-blue as the only accent. These vars
// are the single source of color/shape/type truth for the console UI; the few
// document-level styles in theme/global.css mirror canvas/ink by literal value.

export const colors = stylex.defineVars({
  primary: "#5e6ad2",
  primaryHover: "#828fff",
  primaryActive: "#5e69d1",
  onPrimary: "#ffffff",

  canvas: "#010102",
  canvasSoft: "#0f1011", // recessed fills (inputs on cards, readonly)
  window: "#0f1011", // the floating content window
  surfaceCard: "#141516", // cards, panels, secondary buttons
  surfacePop: "#18191a", // dropdown menus, dialogs
  surfaceStrong: "#23252a", // inline code, monogram tiles, highlights

  hairline: "#23252a",
  hairlineSoft: "#1a1b1e",
  hairlineStrong: "#34343a",

  ink: "#f7f8f8",
  body: "#d0d6e0",
  muted: "#8a8f98",
  mutedSoft: "#62666d",

  // success is Linear's canonical green; error/warning extend the in-product
  // palette (the marketing spec ships no red/amber).
  success: "#27a644",
  error: "#eb5e56",
  warning: "#d2a13c",
});

export const radii = stylex.defineVars({
  xs: "4px",
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  pill: "9999px",
});

export const fonts = stylex.defineVars({
  sans: '"Inter", system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
  mono: '"JetBrains Mono", "Fira Code", ui-monospace, "SF Mono", Menlo, monospace',
});

// The focus ring (2px primary-focus at 50%) and the semantic tints, prebaked
// so components don't each respell the color-mix recipe.
export const effects = stylex.defineVars({
  focusRing: `0 0 0 2px color-mix(in srgb, #5e69d1 50%, transparent)`,
  edgeHighlight: "inset 0 1px 0 rgb(255 255 255 / 0.04)",
});
