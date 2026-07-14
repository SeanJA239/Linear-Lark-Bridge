import { Button } from "@base-ui/react/button";
import { Tabs } from "@base-ui/react/tabs";
import {
  GearSixIcon,
  LightningIcon,
  PlugsConnectedIcon,
  PulseIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";
import * as stylex from "@stylexjs/stylex";
import { Link, Outlet, useLocation } from "react-router";
import { revalidateMe, useMe } from "../lib/auth";
import { useMutation } from "../lib/tayori";
import { logout } from "../sdk";
import { colors, effects, fonts, radii } from "../theme/tokens.stylex";
import { OpenConsoleBanner } from "./OpenConsoleBanner";

const MOBILE = "@media (max-width: 767px)";

const s = stylex.create({
  app: {
    display: "flex",
    flexDirection: { default: "row", [MOBILE]: "column" },
    height: { default: "100dvh", [MOBILE]: "auto" },
    minHeight: { default: null, [MOBILE]: "100dvh" },
    // Base UI: own stacking context so popups layer above the app.
    isolation: "isolate",
  },
  sidebar: {
    flex: "none",
    width: { default: "220px", [MOBILE]: "auto" },
    display: "flex",
    flexDirection: { default: "column", [MOBILE]: "row" },
    alignItems: { default: "stretch", [MOBILE]: "center" },
    gap: { default: "1.5rem", [MOBILE]: "1rem" },
    padding: { default: "1.1rem 0.85rem 0.85rem", [MOBILE]: "0.7rem 0.85rem" },
  },
  appTitle: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0 0.6rem",
    fontSize: "0.8125rem",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: colors.ink,
    whiteSpace: "nowrap",
  },
  // The wordmark's single drop of brand voltage: a small lavender mark.
  brandMark: {
    width: "0.62rem",
    height: "0.62rem",
    borderRadius: "3px",
    backgroundColor: colors.primary,
    flex: "none",
  },
  // Let the Tabs.Root wrapper shrink so the mobile nav strip scrolls instead
  // of widening the page (flex children default to min-width: auto).
  navRoot: {
    minWidth: { [MOBILE]: 0 },
  },
  nav: {
    display: "flex",
    flexDirection: { default: "column", [MOBILE]: "row" },
    gap: "2px",
    overflowX: { default: null, [MOBILE]: "auto" },
    scrollbarWidth: { default: null, [MOBILE]: "none" },
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.55rem",
    flex: { [MOBILE]: "none" },
    fontSize: "0.8125rem",
    fontWeight: 500,
    padding: "0.4rem 0.6rem",
    borderStyle: "none",
    borderRadius: radii.sm,
    backgroundColor: {
      default: "transparent",
      ":hover": `color-mix(in srgb, ${colors.ink} 5%, transparent)`,
    },
    color: { default: colors.muted, ":hover": colors.ink },
    textDecoration: "none",
    cursor: "pointer",
    outline: { ":focus-visible": "none" },
    boxShadow: { ":focus-visible": effects.focusRing },
    transitionProperty: "color, background-color",
    transitionDuration: "0.15s",
  },
  // Active item reads as a lifted surface — the system's depth idiom.
  navItemActive: {
    backgroundColor: colors.surfaceCard,
    color: colors.ink,
  },
  navIcon: {
    flex: "none",
  },
  session: {
    marginTop: { default: "auto", [MOBILE]: 0 },
    marginLeft: { default: null, [MOBILE]: "auto" },
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.6rem",
    padding: { default: "0 0.6rem", [MOBILE]: 0 },
    minWidth: 0,
  },
  userChip: {
    display: { default: null, [MOBILE]: "none" },
    fontSize: "0.75rem",
    color: colors.muted,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  signout: {
    fontFamily: fonts.sans,
    fontSize: "0.6875rem",
    flex: "none",
    padding: "0.28rem 0.6rem",
    borderColor: { default: colors.hairlineStrong, ":hover": colors.mutedSoft },
    borderStyle: "solid",
    borderWidth: "1px",
    borderRadius: radii.md,
    backgroundColor: "transparent",
    color: { default: colors.muted, ":hover": colors.ink },
    cursor: "pointer",
    transitionProperty: "border-color, color",
    transitionDuration: "0.15s",
  },
  // The content window floats on the canvas: a lifted panel with a hairline
  // border, a faint top-edge highlight, and an 8px gutter showing the canvas.
  contentWindow: {
    flex: 1,
    minWidth: 0,
    margin: { default: "8px 8px 8px 0", [MOBILE]: "0 8px 8px" },
    overflowY: { default: "auto", [MOBILE]: "visible" },
    backgroundColor: colors.window,
    borderColor: colors.hairline,
    borderStyle: "solid",
    borderWidth: "1px",
    borderRadius: radii.xl,
    boxShadow: effects.edgeHighlight,
    scrollbarWidth: "thin",
    scrollbarColor: `${colors.hairlineStrong} transparent`,
  },
  contentInner: {
    maxWidth: "1040px",
    margin: "0 auto",
    padding: { default: "2rem 2rem 4rem", [MOBILE]: "1.25rem 1.1rem 3rem" },
  },
});

// Top-level navigation. The per-app pages (Linear/GitHub/GitLab/X/Standup/
// Minutes) are reached by clicking into an app from the Apps overview, not from
// here — so they stay out of the sidebar to keep it from growing with every app.
const TABS = [
  { to: "/status", label: "Apps", Icon: SquaresFourIcon },
  { to: "/actions", label: "Actions", Icon: LightningIcon },
  { to: "/lark-apps", label: "Lark Apps", Icon: PlugsConnectedIcon },
  { to: "/config", label: "Config", Icon: GearSixIcon },
  { to: "/events", label: "Events", Icon: PulseIcon },
] as const;

/// The console shell, Linear-style: a sidebar resting on the canvas (wordmark,
/// vertical nav, session footer) beside a floating content window — a lifted
/// surface panel inset from the viewport edges. Base UI Tabs still supplies the
/// nav semantics and keyboard navigation (each tab renders AS a react-router
/// `<Link>`); the router stays the single source of truth.
export function Layout() {
  const { pathname } = useLocation();
  const current = TABS.find((t) => pathname.startsWith(t.to))?.to ?? "/status";
  const { me } = useMe();
  const who = me?.user?.name || me?.user?.email;
  const signOut = useMutation(logout);

  // End the session, then re-probe /auth/me so the UI returns to login. A
  // failed logout still re-probes — the gate decides what state we're in.
  const onSignOut = async () => {
    try {
      await signOut.trigger({});
    } finally {
      void revalidateMe();
    }
  };

  return (
    <div {...stylex.props(s.app)}>
      <aside {...stylex.props(s.sidebar)}>
        <div {...stylex.props(s.appTitle)}>
          <span {...stylex.props(s.brandMark)} />
          LarkStack Console
        </div>
        <Tabs.Root
          className={stylex.props(s.navRoot).className}
          value={current}
          orientation="vertical"
        >
          <Tabs.List className={stylex.props(s.nav).className}>
            {TABS.map((t) => (
              <Tabs.Tab
                key={t.to}
                value={t.to}
                nativeButton={false}
                className={(state) =>
                  stylex.props(s.navItem, state.active && s.navItemActive)
                    .className ?? ""
                }
                render={<Link to={t.to} />}
              >
                <t.Icon
                  {...stylex.props(s.navIcon)}
                  size={16}
                  weight="regular"
                />
                {t.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.Root>
        {me?.authenticated && (
          <div {...stylex.props(s.session)}>
            {who && (
              <span {...stylex.props(s.userChip)} title={me.user?.email}>
                {who}
              </span>
            )}
            <Button
              className={stylex.props(s.signout).className}
              type="button"
              onClick={onSignOut}
              disabled={signOut.isMutating}
              title="Sign out"
            >
              sign out
            </Button>
          </div>
        )}
      </aside>
      <main {...stylex.props(s.contentWindow)}>
        <div {...stylex.props(s.contentInner)}>
          <OpenConsoleBanner />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
