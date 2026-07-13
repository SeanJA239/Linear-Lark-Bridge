/// Console auth state. The session lives in an HttpOnly cookie set by the Lark
/// OAuth flow; the browser sends it automatically, so there is no token to
/// store. `/auth/me` reports whether OAuth is configured and who is signed in,
/// read through tayori so the App gate and the header chip share one probe.

import { unstable_mutateWithTags } from "tayori";
import { type Me, me } from "../sdk";
import { useData } from "./tayori";

const ME_TAG = "#me";
const SIGNED_OUT: Me = { auth_required: true, authenticated: false };

/// The current session. Re-checks on window focus so a lapsed session bounces
/// back to login when the operator returns to the tab. `/auth/me` never
/// surfaces an error to the UI: a network failure just means "signed out".
export function useMe(): { me: Me | undefined; isLoading: boolean } {
  const { data, error, isLoading } = useData(
    me,
    { cacheTags: [ME_TAG] },
    { revalidateOnFocus: true },
  );
  return { me: error ? SIGNED_OUT : data, isLoading };
}

/// Revalidate the `/auth/me` probe — the client's 401 hook and the SSE
/// reconnect loop call this so the app gate drops to the login screen.
export function revalidateMe(): Promise<unknown> {
  return unstable_mutateWithTags([ME_TAG]);
}

/// Redirect the browser into the Lark OAuth flow.
export function login(): void {
  window.location.assign("/auth/login");
}
