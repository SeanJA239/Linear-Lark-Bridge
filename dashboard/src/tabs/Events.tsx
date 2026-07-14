import * as stylex from "@stylexjs/stylex";
import { useLocalStorage } from "foxact/use-local-storage";
import { useMemo } from "react";
import { Select } from "../components/Select";
import { type Level, useEvents } from "../lib/useEvents";
import { filters } from "../theme/shared";
import { colors, radii } from "../theme/tokens.stylex";
import { typo } from "../theme/typography";

const s = stylex.create({
  header: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "1rem",
    flexWrap: "wrap",
  },
  headerTitle: {
    margin: 0,
  },
  conn: {
    fontVariantNumeric: "tabular-nums",
    color: colors.muted,
  },
  connOk: {
    color: colors.success,
  },
  connDown: {
    color: colors.warning,
  },
  lag: {
    color: colors.warning,
  },
  // The event log recedes to the canvas — a terminal well inside the window.
  log: {
    listStyle: "none",
    padding: 0,
    margin: "0.85rem 0 0",
    maxHeight: "60vh",
    overflowY: "auto",
    borderColor: colors.hairline,
    borderStyle: "solid",
    borderWidth: "1px",
    borderRadius: radii.lg,
    backgroundColor: colors.canvas,
    scrollbarWidth: "thin",
    scrollbarColor: `${colors.hairlineStrong} transparent`,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "auto auto auto 1fr auto",
    gap: "0.6rem",
    alignItems: "baseline",
    padding: "0.35rem 0.7rem",
    borderBottomColor: colors.hairlineSoft,
    borderBottomStyle: "solid",
    borderBottomWidth: { default: "1px", ":last-child": 0 },
    color: colors.body,
  },
  rowEmpty: {
    color: colors.muted,
  },
  ts: {
    fontVariantNumeric: "tabular-nums",
    color: colors.muted,
  },
  level: {
    fontWeight: 600,
    minWidth: "3.2rem",
  },
  levelTrace: { color: colors.mutedSoft },
  levelDebug: { color: colors.muted },
  levelInfo: { color: colors.success },
  levelWarn: { color: colors.warning },
  levelError: { color: colors.error },
  subsys: {
    color: colors.muted,
  },
  msg: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    color: colors.ink,
  },
  fields: {
    color: colors.muted,
    overflowWrap: "anywhere",
  },
});

const LEVEL_ORDER: Record<Level, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

// Log-level ink, drawn from the design palette (semantic tokens, not the
// in-product timeline pastels). trace/debug stay quiet; info/warn/error escalate.
const LEVEL_STYLES: Record<Level, stylex.StyleXStyles> = {
  trace: s.levelTrace,
  debug: s.levelDebug,
  info: s.levelInfo,
  warn: s.levelWarn,
  error: s.levelError,
};

const LEVELS: ReadonlyArray<{ value: Level; label: string }> = [
  { value: "trace", label: "trace+" },
  { value: "debug", label: "debug+" },
  { value: "info", label: "info+" },
  { value: "warn", label: "warn+" },
  { value: "error", label: "error" },
];

export function Events() {
  const { events, connected, laggedCount } = useEvents();
  // Filters persist across reloads (foxact localStorage state, raw strings).
  const [minLevel, setMinLevel] = useLocalStorage<Level>(
    "larkstack.events.level",
    "info",
    { raw: true },
  );
  const [subsystem, setSubsystem] = useLocalStorage<string>(
    "larkstack.events.subsystem",
    "",
    { raw: true },
  );

  const subsystems = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) {
      if (e.subsystem) set.add(e.subsystem);
    }
    return Array.from(set).sort();
  }, [events]);

  const filtered = useMemo(() => {
    const min = LEVEL_ORDER[minLevel];
    return events
      .filter((e) => LEVEL_ORDER[e.level] >= min)
      .filter((e) => !subsystem || e.subsystem === subsystem)
      .slice()
      .reverse();
  }, [events, minLevel, subsystem]);

  return (
    <section>
      <header {...stylex.props(s.header)}>
        <h2 {...stylex.props(s.headerTitle)}>Events</h2>
        <div {...stylex.props(filters.row)}>
          <div {...stylex.props(filters.item)}>
            <span {...stylex.props(filters.label)}>level</span>
            <Select
              value={minLevel}
              onValueChange={(v) => setMinLevel((v || "info") as Level)}
              options={LEVELS}
            />
          </div>
          <div {...stylex.props(filters.item)}>
            <span {...stylex.props(filters.label)}>subsystem</span>
            <Select
              value={subsystem}
              onValueChange={setSubsystem}
              options={[
                { value: "", label: "all" },
                ...subsystems.map((name) => ({ value: name, label: name })),
              ]}
            />
          </div>
          <span {...stylex.props(s.conn, connected ? s.connOk : s.connDown)}>
            {connected ? "● live" : "○ reconnecting"}
          </span>
          {laggedCount > 0 && (
            <span {...stylex.props(s.lag)}>dropped {laggedCount}</span>
          )}
        </div>
      </header>
      <ul {...stylex.props(typo.mono12, s.log)}>
        {filtered.length === 0 && (
          <li {...stylex.props(s.row, s.rowEmpty)}>no events yet</li>
        )}
        {filtered.map((e) => (
          <li key={e.id} {...stylex.props(s.row)}>
            <span {...stylex.props(s.ts)}>
              {new Date(e.timestamp).toLocaleTimeString()}
            </span>
            <span {...stylex.props(s.level, LEVEL_STYLES[e.level])}>
              {e.level.toUpperCase()}
            </span>
            {e.subsystem && (
              <span {...stylex.props(s.subsys)}>[{e.subsystem}]</span>
            )}
            <span {...stylex.props(s.msg)}>{e.message}</span>
            {Object.keys(e.fields).length > 0 && (
              <span {...stylex.props(typo.mono11, s.fields)}>
                {Object.entries(e.fields)
                  .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                  .join(" ")}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
