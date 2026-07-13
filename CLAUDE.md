@AGENTS.md

## Claude Code

Claude-specific additions; the shared guidance lives in `AGENTS.md` (layered per
directory — every `CLAUDE.md` in this repo is an import shim, so always edit
`AGENTS.md`).

- Before committing, run the full gate: `cargo fmt --all -- --check`,
  `cargo clippy --workspace --all-targets -- -D warnings`, `cargo test --workspace`, and
  `pnpm check` + `pnpm build` in `dashboard/` when the frontend changed.
- Verify dashboard changes visually, not just by build: run
  `CONSOLE_PORT=18080 cargo run -p console` (8080 is often taken by another service on
  dev machines) and drive it with Playwright (browser-testing skill). Remember the UI is
  compile-time embedded (`debug-embed`) — `pnpm build`, then rebuild the console.
- Use plan mode for changes to the `App`/`Instance` contract in `crates/larkstack-core`
  — every app implements it, so contract changes fan out across the workspace.
- After touching a `#[utoipa::path]` route or `ToSchema` wire struct, regenerate the
  frontend SDK in the same change: `cargo xtask dump-openapi && cd dashboard && pnpm generate`.
