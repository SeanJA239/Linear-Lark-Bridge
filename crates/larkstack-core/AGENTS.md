# crates/larkstack-core

The plug-in contract + control plane. Apps depend only on this crate (plus `lark-kit` for
the Lark integrations); the host depends on it and never on apps. **Keep `utoipa` (and
other host-side concerns) out of this crate** — the host maps core types to wire structs.

## The contract

- `App` — registered descriptor: `manifest()` (`Manifest`/`ActionSpec`/`Kind`),
  `build(config) -> Arc<dyn Instance>`, optional `migrations()`, `routes(&services)`,
  `ingress_routes(&services)`.
- `Instance` — the running app: `run(cancel)` (main loop; must honor the
  `CancellationToken` for cooperative shutdown) and
  `handle_action(action, params) -> Result<String>` (console-dispatched; results surface
  in the event stream).
- `AppServices` — per-App persistence handed to `build`/`routes`: `state` (`StateStore`
  KV), `metrics` (`MetricsSink`), and `db` (shared relational SQLite, see below).
- `LarkApp`/`LarkRegistry` — the `[lark-apps.<name>]` credential registry.
- `ControlPlane`/`ControlHandle`/`Status`/`Event`/`EventStore` + the tracing→event
  `ControlLayer` — how app state and logs reach the console.

## StateStore vs App tables

Singleton/blob config (one JSON value, never queried) → `StateStore` KV (e.g. standup's
settings, lark-kit's routing config). Relational/multi-row data → an App-owned table in
`apps.db` (e.g. linear's `user_map`).

## App-owned tables (`db` module)

`<data_dir>/apps.db` is a sea-orm/sqlx SQLite handle on `AppServices.db`. An App declares
schema via `App::migrations() -> Vec<Box<dyn MigrationTrait>>`; the host runs them at
startup — **before** the app is enabled, so tables exist for admin use first — through
`larkstack_core::db::run_migrations`, the framework's own runner (not sea-orm's
`Migrator`):

- applied migrations are tracked per-App in one `_larkstack_migrations(app, name)` table;
- each migration runs in a transaction that is **rolled back unless every table it
  creates/drops is namespaced `"<app>_"`** — the prefix is enforced, not conventional
  (caveat: cross-App *alters* aren't detectable and aren't blocked);
- a migration failure leaves just that app Errored, not the whole console.

sea-orm is pinned to the 2.0 release candidate (libsqlite3-sys version unification with
rusqlite) — do not "upgrade" it back to 1.x stable.
