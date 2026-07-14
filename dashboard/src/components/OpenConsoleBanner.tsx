import * as stylex from "@stylexjs/stylex";
import { Link, useLocation } from "react-router";
import { useMe } from "../lib/auth";
import { banner, button } from "../theme/shared";

/// Persistent warning shown on every page while the console is OPEN (no Lark app
/// bound, so `/api/*` needs no session). Links to the guided Setup screen.
/// Hidden once sign-in is enforced, and on the Setup screen itself.
export function OpenConsoleBanner() {
  const { me } = useMe();
  const { pathname } = useLocation();
  if (!me || me.auth_required) return null;
  if (pathname.startsWith("/setup")) return null;
  return (
    <div {...stylex.props(banner.warn, banner.top)}>
      <span>
        ⚠ This console is <strong>open</strong> — anyone who can reach it has
        full admin access.
      </span>
      <Link
        className={stylex.props(button.action, banner.trailingAction).className}
        to="/setup"
      >
        Secure it →
      </Link>
    </div>
  );
}
