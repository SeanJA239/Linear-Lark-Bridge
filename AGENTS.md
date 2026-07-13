# AGENTS.md

Guidance for coding agents working in this repository. This root file carries the
project-wide picture; every crate/app directory has its own `AGENTS.md` with the
specifics — **read the nested file before working inside that directory**.

## Architecture

`larkstack` is a **framework** (Cargo workspace) that supervises pluggable **Apps** and
ships them as a single admin-console binary. Apps come in two kinds — **Integrations**
(external system → Lark bridges) and **Automations** (autonomous, time/event-triggered,
in-Lark) — and plug into the host via the `App`/`Instance` trait.

| Path | Role | Details |
| --- | --- | --- |
| `crates/larkstack-core` | The plug-in contract + control plane: `App`/`Instance`, `AppServices` (StateStore KV, metrics, shared `apps.db`), the prefix-enforcing migration runner, `ControlPlane`/events | `crates/larkstack-core/AGENTS.md` |
| `crates/larkstack` | The host (lib): per-app supervisor, axum admin API (`src/routes/`, utoipa OpenAPI), SSE, Lark-OAuth session gate, embedded React UI, config live-reload | `crates/larkstack/AGENTS.md` |
| `crates/console` | Thin binary `larkstack-console`: registers the bundled apps, runs the host. Adding an app = one `.register(...)` + a crate dep | (this file) |
| `crates/lark-kit` | Shared toolkit for the Lark integrations: card builders, webhook sender + DM bot, `LarkConfig`, the `StateSlot`/`Live` state cell, event-callback scaffold, shared notification `routing` | `crates/lark-kit/AGENTS.md` |
| `dashboard/` | React console UI (Vite + pnpm, Base UI, spec-first generated SDK), embedded into the host at compile time | `dashboard/AGENTS.md` |
| `apps/integrations/linear` | Linear webhooks → Lark cards + issue link previews | `apps/integrations/linear/AGENTS.md` |
| `apps/integrations/github` | GitHub webhooks → Lark cards + reviewer DMs | `apps/integrations/github/AGENTS.md` |
| `apps/integrations/gitlab` | GitLab webhooks → Lark cards (dual auth) | `apps/integrations/gitlab/AGENTS.md` |
| `apps/integrations/x` | X (Twitter) link previews, preview-only | `apps/integrations/x/AGENTS.md` |
| `apps/automations/minutes` | Auto-transcribe recorded meetings → digest cards | `apps/automations/minutes/AGENTS.md` |
| `apps/automations/standup` | Daily standup bot: scheduler + WS command bot | `apps/automations/standup/AGENTS.md` |

Single workspace `Cargo.lock`; members are `["crates/*", "apps/*/*"]`. The deployed
artifact is `larkstack-console`; the integrations are libraries with no `[[bin]]`, the
automations keep one for standalone/CLI use. The integrations share `lark-kit` but no
cross-app `Event` enum; each contributes its inbound router via `App::ingress_routes`,
mounted on the console port under `/webhooks/<app>/` — no per-app ports.

### The App contract (summary)

An App is a registered descriptor (`fn app() -> Arc<dyn App>`) that builds a config-bound
`Instance`; the host owns the lifecycle (`Stopped`/`Starting`/`Running`/`Errored`,
exponential-backoff restarts, panics caught — never left showing green). Key rules:

- `[<app>].enabled` in `config.toml` toggles an app (default **false**); a config change
  restarts **only** the apps whose *change key* (own section + bound `[lark-apps.<ref>]`)
  changed.
- `App::build` reads its `[name]` section from the full TOML and overlays env vars
  (`LINEAR_*`, `LARK_*`, …) per field — secrets stay in the environment, ops fields are
  editable from the UI.
- `Instance::run(cancel)` must honor the `CancellationToken`; `handle_action` results
  surface in the SSE event stream.
- Lark credentials live once under `[lark-apps.<name>]`; apps bind with
  `lark_app = "<name>"`. The registry GET redacts `app_secret`.
- App-owned relational tables live in the shared `apps.db` behind sea-orm migrations whose
  `"<app>_"` table-name prefix is **enforced** by the framework's runner (details in
  `crates/larkstack-core/AGENTS.md`).
- App-contributed routes: `App::routes` → `/api/apps/<name>/` (behind the session gate),
  `App::ingress_routes` → `/webhooks/<name>/` (outside it; webhooks bring their own
  HMAC/token auth). Both are absent from the OpenAPI spec by design.

## Development Environment

The repo uses **[devenv](https://devenv.sh)** (`devenv.nix` + `devenv.yaml`) with
**direnv** for auto-activation: Rust stable (clippy, rustfmt, rust-analyzer), `protoc`
(required by the `larkoapi` build script), and Node.js + `pnpm` for `dashboard/`.

```bash
# Prereqs: Nix (flakes enabled), direnv, devenv (`nix profile install nixpkgs#devenv`)
direnv allow            # one-time, then `cd` triggers shell auto-load
```

Without direnv, drop into the same shell via `devenv shell`. Note: `.envrc` calls
`eval "$(devenv print-dev-env)"` directly to sidestep a SIGABRT bug in devenv 2.1.2's
`direnv-export` on macOS.

The repo-relative `.cargo/config.toml` carries a hard-coded musl cross-compile linker
path for the original author's machine; adjust for your toolchain.

## Docs Convention

- `AGENTS.md` is the single source of agent guidance, layered per directory: this root
  file for the project-wide picture, one `AGENTS.md` per crate/app/dashboard for local
  specifics. Keep each file focused on its own directory; don't duplicate across layers.
- Every `CLAUDE.md` in this repo is a one-line `@AGENTS.md` import shim for Claude Code
  (plus Claude-specific rules at the root). **Edit `AGENTS.md`, never `CLAUDE.md`.**
- When behavior or a public API changes, update the owning `AGENTS.md` in the same change.

## Build, Test, Lint

Workspace commands run from the repo root.

```bash
cargo fmt --all -- --check                                  # format
cargo clippy --workspace --all-targets -- -D warnings       # lint
cargo test --workspace
cargo test -p larkstack-core db::tests                      # one crate + filter
cargo build -p console --release                            # -> target/release/larkstack-console

# Run the console locally (debug); state under ./data (CONSOLE_DATA_DIR), UI on :8080 (CONSOLE_PORT)
cargo run -p console

# Frontend (see dashboard/AGENTS.md for the full loop)
cd dashboard && pnpm install && pnpm build   # embedded build — required for a non-stub UI
cd dashboard && pnpm dev                     # hot-reload dev server, proxies to :8080

# Regenerate the typed frontend SDK after changing console routes/schemas
cargo xtask dump-openapi && cd dashboard && pnpm generate
```

All four checks (fmt, clippy, tests, and `pnpm check` + `pnpm build` when `dashboard/`
changed) must pass before committing. Commit messages follow
`<type>(<scope>): <description>` (e.g. `feat(dashboard): …`, `fix(standup): …`).

## Lark API Patterns

All apps target Lark (international: `open.larksuite.com`, China: `open.feishu.cn`). Base
URL is configurable; most Lark surface comes from the `larkoapi` crate.

**Rule — foundational Lark API changes go upstream to `larkoapi`.** When a basic Lark
endpoint is missing, broken, or needs new behavior, fix it in the `larkoapi` crate (then
bump the dependency here) — do **not** add a local wrapper or hand-roll the HTTP/protobuf
call in this repo. Lark-flavored helpers that *compose* the client (card builders, the
webhook sender, the event-callback scaffold) still belong in `lark-kit`.

- **Token caching**: tenant access tokens are cached with a 5-minute expiry buffer.
- **Card format**: JSON 1.0 (`header` + `elements` at top level). `column_set` for
  multi-column layout, `action` for button rows; buttons cannot nest inside `column`s.
- **WebSocket protocol**: POST `/callback/ws/endpoint` with `AppID`/`AppSecret` → WSS URL
  → protobuf binary frames. Card action callbacks arrive as
  `event_type: "card.action.trigger"` with `frame_type: "event"` (not `"card"`).
- **Card callback ACK**: ACK frame payload is
  `{"code": 200, "data": "<base64 of response JSON>"}`; the response JSON is
  `{"card": {"type": "raw", "data": {<card JSON>}}}`.
