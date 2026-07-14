import { Switch } from "@base-ui/react/switch";
import {
  type IconType,
  SiGithub,
  SiGitlab,
  SiLinear,
  SiX,
} from "@icons-pack/react-simple-icons";
import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import { Link } from "react-router";
import { Spinner } from "../components/Spinner";
import { invalidate, TAG_APPS, TAG_STATUS } from "../lib/cache";
import { errMessage } from "../lib/errors";
import { useData, useMutation } from "../lib/tayori";
import {
  getStatus,
  listApps,
  type SubsystemState,
  setAppEnabled,
} from "../sdk";
import { card } from "../theme/shared";
import { colors, radii } from "../theme/tokens.stylex";
import { typo } from "../theme/typography";

const s = stylex.create({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))",
    gap: "0.9rem",
  },
  card: {
    position: "relative",
    transitionProperty: "border-color",
    transitionDuration: "0.15s",
  },
  cardErrored: {
    borderColor: `color-mix(in srgb, ${colors.error} 45%, transparent)`,
  },
  cardLinkable: {
    cursor: "pointer",
    borderColor: { default: colors.hairline, ":hover": colors.hairlineStrong },
  },
  // Linkable + errored: rest on the error tint, still lift on hover.
  cardLinkableErrored: {
    borderColor: {
      default: `color-mix(in srgb, ${colors.error} 45%, transparent)`,
      ":hover": colors.hairlineStrong,
    },
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.55rem",
  },
  name: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.55rem",
    color: colors.ink,
  },
  // Brand logo (simple-icons) sits flush-left of the app name; inherits ink.
  logo: {
    flex: "none",
    color: colors.ink,
  },
  // Fallback for apps with no third-party brand: a neutral monogram tile.
  logoMono: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "18px",
    height: "18px",
    borderRadius: radii.xs,
    backgroundColor: colors.surfaceStrong,
    color: colors.muted,
  },
  // Stretched link covering the whole card; the controls sit above it.
  cardLink: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
    borderRadius: "inherit",
  },
  // position+z-index keep the toggle and its status pill above the card's
  // stretched link so they stay clickable.
  controls: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
  },
  // Status pill — caption-uppercase, semantic-colored, faint tint behind.
  pill: {
    borderColor: "currentColor",
    borderStyle: "solid",
    borderWidth: "1px",
    padding: "0.12rem 0.5rem",
    borderRadius: radii.pill,
    color: colors.muted,
  },
  pillRunning: {
    color: colors.success,
    backgroundColor: `color-mix(in srgb, ${colors.success} 10%, transparent)`,
  },
  pillErrored: {
    color: colors.error,
    backgroundColor: `color-mix(in srgb, ${colors.error} 10%, transparent)`,
  },
  pillStarting: {
    color: colors.warning,
    backgroundColor: `color-mix(in srgb, ${colors.warning} 12%, transparent)`,
  },
  pillStopped: {
    color: colors.muted,
    backgroundColor: `color-mix(in srgb, ${colors.muted} 10%, transparent)`,
  },
  msg: {
    margin: "0.35rem 0",
    color: colors.error,
    wordBreak: "break-word",
  },
  cardFooter: {
    marginTop: "0.55rem",
    color: colors.muted,
  },
  // Toggle track: a flex row so the thumb is vertically centered and the inset
  // padding alone fixes its left/right rest positions (translateX only animates).
  switch: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    width: "2.1rem",
    height: "1.15rem",
    padding: "0 0.13rem",
    borderStyle: "none",
    borderRadius: radii.pill,
    backgroundColor: colors.hairlineStrong,
    cursor: { default: "pointer", ":disabled": "not-allowed" },
    opacity: { ":disabled": 0.5 },
    transitionProperty: "background-color",
    transitionDuration: "0.15s",
    flexShrink: 0,
  },
  switchChecked: {
    backgroundColor: colors.success,
  },
  thumb: {
    width: "0.9rem",
    height: "0.9rem",
    borderRadius: "50%",
    backgroundColor: colors.onPrimary,
    transform: "translateX(0)",
    transitionProperty: "transform",
    transitionDuration: "0.15s",
  },
  // Inner track width = 2.1 − 2×0.13 = 1.84rem; thumb 0.9rem → slide 0.94rem.
  thumbChecked: {
    transform: "translateX(0.94rem)",
  },
});

/// Pill colors keyed by subsystem state so the pill stays in the semantic
/// palette — no inline hex.
const PILL_STATE: Record<SubsystemState, stylex.StyleXStyles> = {
  running: s.pillRunning,
  errored: s.pillErrored,
  starting: s.pillStarting,
  stopped: s.pillStopped,
};

/// Apps that have a dedicated config page. Their card title links there; any
/// app without an entry here renders a plain, static title.
const APP_ROUTES: Record<string, string> = {
  linear: "/linear",
  github: "/github",
  gitlab: "/gitlab",
  x: "/x",
  standup: "/standup",
  minutes: "/minutes",
};

/// Proper-cased product names + brand logos (simple-icons) for the registered
/// apps. Our own automations have no third-party brand, so they carry only a
/// label and fall back to a monogram tile. Unknown apps render their raw name.
const APP_BRANDS: Record<string, { label: string; Icon?: IconType }> = {
  linear: { label: "Linear", Icon: SiLinear },
  github: { label: "GitHub", Icon: SiGithub },
  gitlab: { label: "GitLab", Icon: SiGitlab },
  x: { label: "X", Icon: SiX },
  standup: { label: "Standup" },
  minutes: { label: "Minutes" },
};

function appLabel(name: string): string {
  return APP_BRANDS[name]?.label ?? name;
}

/// The app's brand logo, or — for our own automations — a neutral monogram tile
/// of the label's first letter. Icons inherit the text color (theme-adaptive).
function AppLogo({ name }: { name: string }) {
  const Icon = APP_BRANDS[name]?.Icon;
  if (Icon) return <Icon {...stylex.props(s.logo)} size={18} aria-hidden />;
  return (
    <span {...stylex.props(typo.label, s.logo, s.logoMono)} aria-hidden>
      {appLabel(name).charAt(0).toUpperCase()}
    </span>
  );
}

function freshness(ms: number): string {
  const dt = Date.now() - ms;
  if (dt < 1000) return "just now";
  if (dt < 60_000) return `${Math.floor(dt / 1000)}s ago`;
  if (dt < 3_600_000) return `${Math.floor(dt / 60_000)}m ago`;
  return `${Math.floor(dt / 3_600_000)}h ago`;
}

export function Status() {
  const { data: status, error } = useData(
    getStatus,
    { cacheTags: [TAG_STATUS] },
    { refreshInterval: 3000 },
  );
  const { data: appsData } = useData(listApps, { cacheTags: [TAG_APPS] });
  const subsystems = status?.subsystems ?? {};
  const apps = appsData?.apps;

  const toggle = useMutation(setAppEnabled);
  const [pending, setPending] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const onToggle = async (name: string, enabled: boolean) => {
    setPending(name);
    setToggleError(null);
    try {
      await toggle.trigger({ path: { app: name }, body: { enabled } });
      await invalidate(TAG_APPS, TAG_STATUS);
    } catch (e) {
      setToggleError(`${name}: ${errMessage(e)}`);
    } finally {
      setPending(null);
    }
  };

  return (
    <section>
      <h2>Apps</h2>
      {error !== undefined && (
        <p className="error">Failed to load: {errMessage(error)}</p>
      )}
      {toggleError && <p className="error">{toggleError}</p>}
      {!apps && <Spinner />}
      {apps && apps.length === 0 && <p className="muted">no apps registered</p>}
      {apps && apps.length > 0 && (
        <div {...stylex.props(s.grid)}>
          {apps.map((app) => {
            const sub = subsystems[app.name];
            const state: SubsystemState =
              sub?.state ?? (app.enabled ? "starting" : "stopped");
            const route = APP_ROUTES[app.name];
            const errored = state === "errored";
            return (
              <article
                key={app.name}
                {...stylex.props(
                  card.base,
                  s.card,
                  errored && s.cardErrored,
                  route !== undefined && s.cardLinkable,
                  route !== undefined && errored && s.cardLinkableErrored,
                )}
              >
                {/* Stretched link: the whole card navigates to the app's page,
                    while the controls below sit above this overlay and stay
                    clickable (avoids invalid <button>-inside-<a> nesting). */}
                {route && (
                  <Link
                    {...stylex.props(s.cardLink)}
                    to={route}
                    aria-label={`open ${appLabel(app.name)} settings`}
                  />
                )}
                <header {...stylex.props(s.head)}>
                  <span {...stylex.props(typo.mono13, s.name)}>
                    <AppLogo name={app.name} />
                    {appLabel(app.name)}
                  </span>
                  <div {...stylex.props(s.controls)}>
                    <span
                      {...stylex.props(typo.caption, s.pill, PILL_STATE[state])}
                    >
                      {state}
                    </span>
                    <Switch.Root
                      className={(st) =>
                        stylex.props(s.switch, st.checked && s.switchChecked)
                          .className ?? ""
                      }
                      checked={app.enabled}
                      disabled={pending === app.name}
                      onCheckedChange={(checked) => onToggle(app.name, checked)}
                      aria-label={`${app.enabled ? "disable" : "enable"} ${appLabel(app.name)}`}
                    >
                      <Switch.Thumb
                        className={(st) =>
                          stylex.props(s.thumb, st.checked && s.thumbChecked)
                            .className ?? ""
                        }
                      />
                    </Switch.Root>
                  </div>
                </header>
                {sub?.message && (
                  <p {...stylex.props(typo.body, s.msg)}>{sub.message}</p>
                )}
                <footer {...stylex.props(typo.callout, s.cardFooter)}>
                  {sub ? `updated ${freshness(sub.updated_at)}` : "not started"}
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
