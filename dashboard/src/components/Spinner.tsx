import * as stylex from "@stylexjs/stylex";
import { colors } from "../theme/tokens.stylex";

const spin = stylex.keyframes({
  to: { transform: "rotate(360deg)" },
});

const s = stylex.create({
  spinner: {
    display: "inline-block",
    width: "1.5rem",
    height: "1.5rem",
    borderColor: colors.hairlineStrong,
    borderStyle: "solid",
    borderWidth: "2px",
    borderTopColor: colors.ink,
    borderRadius: "50%",
    animationName: spin,
    animationDuration: {
      default: "0.7s",
      "@media (prefers-reduced-motion: reduce)": "1.6s",
    },
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
  },
  fullscreenSpinner: {
    width: "2.25rem",
    height: "2.25rem",
    borderWidth: "3px",
  },
  // Full-screen variant: center the spinner in the viewport.
  screen: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});

/// A pure-CSS loading spinner. Pass `fullscreen` to center it in the viewport
/// for route-/app-level loading states; otherwise it renders inline.
export function Spinner({
  fullscreen = false,
  label = "Loading",
}: {
  fullscreen?: boolean;
  label?: string;
}) {
  const spinner = (
    <span
      {...stylex.props(s.spinner, fullscreen && s.fullscreenSpinner)}
      role="status"
      aria-label={label}
    />
  );
  if (!fullscreen) return spinner;
  return <div {...stylex.props(s.screen)}>{spinner}</div>;
}
