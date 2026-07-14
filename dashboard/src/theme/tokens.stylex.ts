import * as stylex from "@stylexjs/stylex";

// The Linear design language (see /DESIGN.md), themed for both color schemes
// via prefers-color-scheme: every var carries a light default and a dark
// override, so components stay scheme-agnostic. Dark is the canonical Linear
// palette; light anchors on the spec's inverse tokens (#ffffff / #f5f6f6)
// with the same surface-ladder + hairline depth model. The lavender accent is
// shared; semantic colors darken on light for contrast.

const DARK = "@media (prefers-color-scheme: dark)";

export const colors = stylex.defineVars({
  primary: "#5e6ad2",
  primaryHover: { default: "#4f5ac8", [DARK]: "#828fff" },
  primaryActive: { default: "#4650b8", [DARK]: "#5e69d1" },
  onPrimary: "#ffffff",

  canvas: { default: "#f4f4f5", [DARK]: "#010102" },
  // Recessed fills (inputs on cards, readonly).
  canvasSoft: { default: "#f0f0f2", [DARK]: "#0f1011" },
  // The floating content window.
  window: { default: "#ffffff", [DARK]: "#0f1011" },
  // Cards, panels, secondary buttons.
  surfaceCard: { default: "#f9f9fa", [DARK]: "#141516" },
  // Dropdown menus, dialogs.
  surfacePop: { default: "#ffffff", [DARK]: "#18191a" },
  // Inline code, monogram tiles, highlights.
  surfaceStrong: { default: "#ececee", [DARK]: "#23252a" },

  hairline: { default: "#e6e5e8", [DARK]: "#23252a" },
  hairlineSoft: { default: "#f0eff2", [DARK]: "#1a1b1e" },
  hairlineStrong: { default: "#d4d3d8", [DARK]: "#34343a" },

  ink: { default: "#26262b", [DARK]: "#f7f8f8" },
  body: { default: "#45454d", [DARK]: "#d0d6e0" },
  muted: { default: "#6f6e77", [DARK]: "#8a8f98" },
  mutedSoft: { default: "#9c9ba3", [DARK]: "#62666d" },

  // success is Linear's canonical green; error/warning extend the in-product
  // palette. All three darken on light to keep AA contrast on tinted pills.
  success: { default: "#178a3e", [DARK]: "#27a644" },
  error: { default: "#d13d38", [DARK]: "#eb5e56" },
  warning: { default: "#a67c1c", [DARK]: "#d2a13c" },
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

// Scheme-dependent shadow/highlight recipes, prebaked so components never
// hardcode rgb() literals that only work on one scheme. The focus ring (2px
// primary-focus at 50%) is shared.
export const effects = stylex.defineVars({
  focusRing: "0 0 0 2px color-mix(in srgb, #5e69d1 50%, transparent)",
  edgeHighlight: {
    default: "inset 0 1px 0 rgb(255 255 255 / 0.8)",
    [DARK]: "inset 0 1px 0 rgb(255 255 255 / 0.04)",
  },
  popShadow: {
    default: "0 8px 28px rgb(0 0 0 / 0.14)",
    [DARK]: "0 8px 28px rgb(0 0 0 / 0.5)",
  },
  dialogShadow: {
    default: "0 16px 70px rgb(0 0 0 / 0.2)",
    [DARK]: "0 16px 70px rgb(0 0 0 / 0.6)",
  },
  overlay: {
    default: "rgb(0 0 0 / 0.35)",
    [DARK]: "rgb(0 0 0 / 0.55)",
  },
});
