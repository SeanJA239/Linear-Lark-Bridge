# crates/larkstack (host)

`Larkstack::new().register(app).run()`. `run()` opens the SQLite store, loads/creates
`config.toml`, installs the tracing→event layer, spawns one `supervisor::supervise` task
per registered app, then serves the admin API + UI.

## HTTP surface (`src/routes/`)

One module per group: `status`, `config`, `events`, `actions`, `lark_apps`, `oauth`, plus
shared `OkResponse`/`ErrorResponse`/`ApiError` in `mod.rs`. `routes::build(state)`
assembles the router through `utoipa-axum`'s `OpenApiRouter`, so the OpenAPI spec is
collected from the very route definitions that are served — it can't drift. Request/
response bodies are typed `ToSchema` structs; the endpoints that wrap `larkstack-core`
types map core → wire structs explicitly so `larkstack-core` never depends on `utoipa`.
After changing a `#[utoipa::path]` route or a `ToSchema` struct, regenerate the frontend
SDK (`cargo xtask dump-openapi` + `pnpm generate` — see `dashboard/AGENTS.md`).

Routes:

- `GET /api/status` — `{ "subsystems": { "<name>": { "state", "message", "updated_at" } } }`
- `GET /api/apps` — registered app manifests `{ "apps": [{ name, kind, description, actions }] }`
- `GET /api/events` — SSE stream of `Event { id, level, subsystem, target, message, fields, timestamp }`.
  Honors `Last-Event-ID` / `?since=<id>` for backfill; otherwise replays the most recent
  200 events from SQLite, then streams live.
- `GET /api/config` — current TOML. `PUT /api/config` — validates by parsing, writes the
  file, broadcasts via `ControlPlane`'s watch channel; each supervisor restarts only if
  its own change key changed.
- `GET /api/lark-apps` — `{ "lark_apps": [{ name, app_id, base_url, has_secret }] }`
  (`app_secret` redacted). `POST /api/lark-apps` — **live-tests** the credentials (mints a
  `tenant_access_token`) and, only if valid, upserts `[lark-apps.<name>]` via `toml_edit`
  (comments preserved) + broadcasts; `400` if the test fails (nothing saved).
  `POST /api/lark-apps/test` — dry-run the same check (`200 {ok, expire|error}`).
  `DELETE /api/lark-apps/{name}` — remove (`404` if absent).
- `POST /api/actions/{app}/{action}` — fire-and-forget; body is the optional `params`
  JSON. `202` on dispatch, `404` unknown app, `503` app not running. The result string
  appears in the SSE event stream.
- `/api/apps/{app}/*` — App-contributed admin routes (`App::routes`), behind the session
  gate; shape is App-defined. Not in the OpenAPI spec.
- `/webhooks/{app}/*` — App-contributed public inbound routes (`App::ingress_routes`),
  **outside** the gate (callers authenticate with their own HMAC/token). Not in the spec.
- `GET /api/openapi.json` — the OpenAPI 3.1 spec. `GET /api/docs` — Scalar explorer over
  it (loads Scalar's JS from a CDN). Both ungated: shapes only, no data.
- `GET /api/health` — `"ok"`. `GET /*` — embedded React SPA (falls back to `index.html`).

## Auth (Lark OAuth, `src/routes/oauth.rs`)

`GET /auth/login` (mint state + PKCE, redirect to Lark's
`accounts.*/open-apis/authen/v1/authorize`), `GET /auth/callback` (verify state, exchange
the code at `open.*/open-apis/authen/v2/oauth/token`, fetch `user_info`, check the
`admins` allowlist, set a signed session cookie), `POST /auth/logout`, `GET /auth/me`
(ungated — `{ auth_required, authenticated, user? }`; the UI uses it to decide whether to
show the login screen).

`/api/*` (except `/api/health`, `/api/openapi.json`, `/api/docs`) is gated by the
signed-cookie session, resolved per-request from the live config, and stays OPEN while
`[console].lark_app` is unbound. The allowlist matches the Lark `user_info`
`email`/`enterprise_email`, which are only returned when their contact scopes are
requested — so when `admins` is non-empty and `[console].scope` is unset, the authorize
request defaults to the full user-info identity set
(`contact:user.email|employee|employee_id|phone:readonly`); an explicit `scope` overrides
it (empty = none). Every requested scope must be granted on the Lark app's Permission
Management page or the authorize page fails with error `20027`.

## Supervisor (`src/supervisor.rs`)

The per-app state machine (see *The App contract* in the root `AGENTS.md`). The `enabled`
check and change detection use a `ChangeKey` = the app's top-level section + the
`[lark-apps.<ref>]` it binds to; exponential backoff (1s→60s) governs build-error/crash
restarts.

## Embedded UI (`src/assets.rs`, `build.rs`)

`rust-embed` with the `debug-embed` feature bakes `../../dashboard/dist/` in at compile
time — **even debug builds serve the dist that existed at compile time**, so after a
frontend change run `pnpm build` and rebuild/rerun the console to see it. `build.rs`
writes a stub `index.html` if the frontend isn't built yet so `cargo build` always
succeeds.

## Ops

Env: `CONSOLE_PORT` (default `8080`), `CONSOLE_DATA_DIR` (default `./data`; holds
`events.db`, `config.toml`, `state.db`/`metrics.db`, `apps.db`, and the auto-generated
`session.key`), `CONSOLE_SECRET` (optional; derives the cookie signing key so sessions
survive restarts — else a random key is persisted to `session.key`).

Shutdown: SIGINT/SIGTERM → `axum::serve(...).with_graceful_shutdown(...)`. Event log
retention: SQLite keeps the most recent 10,000 events (rolling); on startup the host
advances the in-memory id counter past `MAX(id)`.

Container: workspace-root `Dockerfile` (node → rust → debian:slim); `docker-compose.yml`
mounts a named volume at `/data`.
