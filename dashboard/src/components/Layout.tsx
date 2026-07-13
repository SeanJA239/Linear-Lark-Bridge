import { Button } from "@base-ui/react/button";
import { Tabs } from "@base-ui/react/tabs";
import { Link, Outlet, useLocation } from "react-router";
import { revalidateMe, useMe } from "../lib/auth";
import { useMutation } from "../lib/tayori";
import { logout } from "../sdk";
import { OpenConsoleBanner } from "./OpenConsoleBanner";

// Top-level navigation. The per-app pages (Linear/GitHub/GitLab/X/Standup/
// Minutes) are reached by clicking into an app from the Apps overview, not from
// here — so they stay out of the header to keep it from growing with every app.
const TABS = [
  { to: "/status", label: "Apps" },
  { to: "/actions", label: "Actions" },
  { to: "/lark-apps", label: "Lark Apps" },
  { to: "/config", label: "Config" },
  { to: "/events", label: "Events" },
] as const;

/// The console shell: a Base UI Tabs bar whose value is driven by the URL (each
/// tab is rendered AS a react-router `<Link>`), plus the routed content via
/// `<Outlet>`. The router stays the single source of truth — Base UI supplies
/// the widget semantics, keyboard navigation, and active styling.
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
      <header className="app-header">
        <div className="app-title">LarkStack Console</div>
        <Tabs.Root value={current}>
          <Tabs.List className="tabs">
            {TABS.map((t) => (
              <Tabs.Tab
                key={t.to}
                value={t.to}
                nativeButton={false}
                className={(state) => (state.active ? "tab active" : "tab")}
                render={<Link to={t.to} />}
              >
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
      </header>
      <main>
        <OpenConsoleBanner />
        <Outlet />
      </main>
    </div>
  );
}
