import { Button } from "@base-ui/react/button";
import { Tabs } from "@base-ui/react/tabs";
import {
  GearSixIcon,
  LightningIcon,
  PlugsConnectedIcon,
  PulseIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";
import { Link, Outlet, useLocation } from "react-router";
import { revalidateMe, useMe } from "../lib/auth";
import { useMutation } from "../lib/tayori";
import { logout } from "../sdk";
import { OpenConsoleBanner } from "./OpenConsoleBanner";

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
    <div className="app">
      <aside className="sidebar">
        <div className="app-title">LarkStack Console</div>
        <Tabs.Root className="nav-root" value={current} orientation="vertical">
          <Tabs.List className="nav">
            {TABS.map((t) => (
              <Tabs.Tab
                key={t.to}
                value={t.to}
                nativeButton={false}
                className={(state) =>
                  state.active ? "nav-item active" : "nav-item"
                }
                render={<Link to={t.to} />}
              >
                <t.Icon className="nav-icon" size={16} weight="regular" />
                {t.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.Root>
        {me?.authenticated && (
          <div className="session">
            {who && (
              <span className="user-chip" title={me.user?.email}>
                {who}
              </span>
            )}
            <Button
              className="signout"
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
      <main className="content-window">
        <div className="content-inner">
          <OpenConsoleBanner />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
