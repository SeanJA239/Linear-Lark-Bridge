# standup

Daily standup runner: WebSocket command bot + scheduler. Actions:
`announce | ensure | remind | urgent | urgent-user | check` (accept optional
`today | tomorrow | YYYY-MM-DD`; `urgent-user` also needs `open_id`). Uses `larkoapi`
over a WebSocket long connection.

## Layout (ports-and-adapters)

The five operations (`ensure`/`announce`/`remind`/`urgent_one`/`check`) live once in
`flow.rs` — the domain core — and every inbound surface translates its trigger into a
`flow` call; the Lark API is reached only through the `lark/` adapter:

- `flow.rs` — Domain: the high-level standup operations. Composes `lark::doc` +
  `lark::card`; the single source of orchestration. Takes the live `&Settings`.
- `lark/` — Outbound adapter (the only code that talks to Lark).
  - `lark/doc.rs` — the standup doc: create the per-day Docx, seed the member table, read
    it back to detect who hasn't filled their cells. Title/headers/column-widths come
    from `Settings`.
  - `lark/card.rs` — announce + reminder card builders; title/body rendered from the
    `Settings` minijinja templates (only the card colors are fixed).
- `settings/` — Admin-tunable runtime behavior stored as **one JSON blob in the per-App
  `StateStore` KV** (namespace `standup`, key `settings`) — a singleton config, never
  queried, so the KV fits better than a relational table. `Settings`/`Default`/`load`/
  `save`; tolerant decode (`#[serde(default)]`, bad values → defaults). Holds the
  schedule (per-job time + enable + IANA timezone), the doc wording, and the six
  minijinja message templates. `routes.rs` serves admin
  `GET/PUT /api/apps/standup/settings` (mounted via `App::routes` using
  `services.state`). Edited live from the console's **Standup** tab — no restart; the
  scheduler/bot reload each pass.
- `template.rs` — runtime minijinja rendering (`render(tpl, ctx)`); templates are
  admin-editable strings, so they're evaluated at runtime, not compiled.
- `trigger/` — inbound surfaces that drive `flow` (the standalone CLI in `main.rs` is the
  fourth). Each loads `settings` fresh so console edits apply at once.
  - `trigger/scheduler.rs` — autonomous timer; the four jobs read time/enable/timezone
    from `settings` each pass (DST-safe), honor `cancel`.
  - `trigger/commands.rs` — `WsEventHandler` impl for chat command parsing (`@-mention`
    detection).
  - `trigger/actions.rs` — console action dispatch (`handle(action, params)`).
- `runtime/` — bootstrap + console-host integration.
  - `runtime/app.rs` — `App`/`Instance` impl registered by the console; `routes()` mounts
    the settings router; the instance holds the `StateStore`.
  - `runtime/run.rs` — `build_bot` + `serve_with_bot` (WS bot + scheduler wiring); shared
    by the host instance and the standalone binary.
- `config.rs` — secrets/bindings only (`[standup]`: `chat_id`, `folder_token`,
  `lark_app`, `enabled`). `date.rs` — `today()`/`tomorrow()`/`resolve()`, each taking the
  configured timezone.

## Config split

`config.toml` carries only secrets/bindings; **behavioral knobs + templates live in the
`StateStore` settings blob**, edited live from the console's Standup tab. The standalone
bin opens its own `StateStore` (`<CONSOLE_DATA_DIR>/state.db`) so the CLI shares the same
settings.

Required env: `LARK_APP_ID`, `LARK_APP_SECRET`, `STANDUP_CHAT_ID`,
`STANDUP_FOLDER_TOKEN`, `STANDUP_ENABLED=true` (scheduler master switch). Optional:
`LARK_BASE_URL` (default `https://open.larksuite.com`). Note the `[standup].enabled` host
toggle is distinct from `[standup.standup].enabled` (scheduler auto-fire); per-job
toggles + times are in the settings blob.
