# dashboard/

The console UI: React 19 + Vite (**pnpm**, rolldown-vite). Embedded into the host at
compile time — `pnpm build` emits `dist/`, which `rust-embed` (with `debug-embed`) bakes
into `crates/larkstack`, so **a UI change needs `pnpm build` and a console rebuild** to
show in the served binary. The dev loop avoids that: `pnpm dev` hot-reloads and proxies
`/api` + `/auth` to a console on `:8080` (`vite.config.ts`).

```bash
pnpm dev          # Vite dev server, alongside `cargo run -p console`
pnpm build        # tsc -b + vite build -> dist/ (embedded)
pnpm check        # biome lint + format check (fix: pnpm check:fix)
pnpm generate     # openapi.json -> src/sdk/ (after `cargo xtask dump-openapi`)
```

## Stack

- **Base UI** (`@base-ui/react`) for all controls — prefer it over hand-rolled HTML
  controls. Known gaps in v1.5.0 (no spinner, no textarea) are the only exceptions.
- **react-router** (`src/App.tsx` routes), **react-hook-form** for forms, **foxact**
  utility hooks, **@phosphor-icons/react** for UI icons (16px, one family — never
  hand-roll SVG icons; brand logos come from `@icons-pack/react-simple-icons`).
- **biome** is the formatter/linter (`biome.jsonc`).

## Data layer (spec-first)

`cargo xtask dump-openapi` writes the console's OpenAPI spec to `openapi.json` (derived
without a running host via `larkstack::openapi_json()`); `pnpm generate`
(`@hey-api/openapi-ts`, config in `openapi-ts.config.ts`) turns it into `src/sdk/` — a ky
client with per-operation zod response validation. **Both artifacts are committed**;
regenerate (dump → generate) whenever a `#[utoipa::path]` route or `ToSchema` wire struct
changes.

Components consume the SDK through [tayori](https://github.com/SukkaW/tayori)
(`src/lib/tayori.ts`: `useData`/`useMutation` — the SWR key *is* the SDK fn + arg), with
cross-view invalidation via `cacheTags` (`src/lib/cache.ts`). App-contributed routes
(`/api/apps/<app>/…`) are absent from the spec by design; they get hand-written SDK-shaped
functions + zod schemas in `src/lib/{routing,linear,standup}-api.ts`, consumed by the same
hooks. `ky` is pinned to `^1` — `@hey-api/client-ky`'s error path double-reads the
response body under ky 2.

## Design system

`DESIGN.md` (repo root) is the visual spec: the Linear design language — near-black
canvas (`#010102`), a surface ladder + 1px hairlines for depth (no drop shadows on page
surfaces), lavender-blue `#5e6ad2` as the **only** accent (brand mark, primary CTAs,
focus rings, links), Inter/system-sans, JetBrains Mono for code surfaces.

The shell is the Linear app idiom: a sidebar on the canvas beside a floating content
window (`src/components/Layout.tsx`). All styling is token-driven plain CSS in
`src/styles.css` (`:root` custom properties) — extend the tokens, don't inline hex values.
Semantic colors: success green for app on/off state, lavender for selection, red/amber
reserved for errors/warnings.
