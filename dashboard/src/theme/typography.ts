import * as stylex from "@stylexjs/stylex";
import { fonts } from "./tokens.stylex";

// The console type ramp — a discrete scale in the spirit of Apple HIG's macOS
// text styles (the console is a desktop product surface; Linear's own app
// runs a comparable 13px-body system). Every text element references one of
// these styles; components never spell out ad-hoc font sizes or weights.
// Apply first (`stylex.props(typo.body, s.local)`) so local styles may still
// override a property deliberately.

export const typo = stylex.create({
  /** 22/600 — page titles (login). */
  title1: {
    fontFamily: fonts.sans,
    fontSize: "1.375rem",
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
  },
  /** 17/600 — dialog titles. */
  title2: {
    fontFamily: fonts.sans,
    fontSize: "1.0625rem",
    fontWeight: 600,
    lineHeight: 1.25,
    letterSpacing: "-0.01em",
  },
  /** 15/600 — card and section titles. */
  title3: {
    fontFamily: fonts.sans,
    fontSize: "0.9375rem",
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: "-0.01em",
  },
  /** 13/600 — emphasized body (step titles, key names). */
  headline: {
    fontFamily: fonts.sans,
    fontSize: "0.8125rem",
    fontWeight: 600,
    lineHeight: 1.45,
    letterSpacing: "0",
  },
  /** 13/400 — the default UI text: body copy, inputs, table cells. */
  body: {
    fontFamily: fonts.sans,
    fontSize: "0.8125rem",
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: "0",
  },
  /** 13/500 — buttons, nav items, interactive labels. */
  bodyMedium: {
    fontFamily: fonts.sans,
    fontSize: "0.8125rem",
    fontWeight: 500,
    lineHeight: 1.45,
    letterSpacing: "0",
  },
  /** 12/400 — secondary copy: hints, help text, feedback lines. */
  callout: {
    fontFamily: fonts.sans,
    fontSize: "0.75rem",
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: "0",
  },
  /** 11/400 — meta: timestamps, footers, item ids. */
  footnote: {
    fontFamily: fonts.sans,
    fontSize: "0.6875rem",
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: "0",
  },
  /** 11/500 caps — section eyebrows and field labels. */
  label: {
    fontFamily: fonts.sans,
    fontSize: "0.6875rem",
    fontWeight: 500,
    lineHeight: 1.35,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  /** 10/500 caps — status pills, badges. */
  caption: {
    fontFamily: fonts.sans,
    fontSize: "0.625rem",
    fontWeight: 500,
    lineHeight: 1.3,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  /** 13 mono — code editors, identifiers beside icons. */
  mono13: {
    fontFamily: fonts.mono,
    fontSize: "0.8125rem",
    fontWeight: 400,
    lineHeight: 1.55,
    letterSpacing: "0",
  },
  /** 12 mono — event log rows, inline code. */
  mono12: {
    fontFamily: fonts.mono,
    fontSize: "0.75rem",
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: "0",
  },
  /** 11 mono — dense meta: log fields, rule badges, ids. */
  mono11: {
    fontFamily: fonts.mono,
    fontSize: "0.6875rem",
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: "0",
  },
});
