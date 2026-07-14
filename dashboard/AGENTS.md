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
- **StyleX** (`@stylexjs/stylex`) for all component styling — see *Styling* below.
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

## Styling (StyleX)

Compile-time **StyleX**, integrated via the official `@stylexjs/unplugin` in
`vite.config.ts` (plugin-react v6 is oxc-based, so the Babel-plugin route is
unavailable); dev serves aggregated CSS through `virtual:stylex:runtime`, imported
conditionally in `main.tsx`.

- `src/theme/tokens.stylex.ts` — the design tokens (`stylex.defineVars`), sourced from
  `DESIGN.md`. **Every color/effect var carries a light default and a
  `prefers-color-scheme: dark` override** — components stay scheme-agnostic; never
  inline hex values or `rgb()` shadow literals (use `effects.*`).
- `src/theme/typography.ts` — the type ramp (HIG-style desktop scale: title1 22/600,
  title2 17/600, title3 15/600, headline 13/600, body 13/400, bodyMedium 13/500,
  callout 12, footnote 11, label 11/500 caps, caption 10/500 caps, mono13/12/11).
  Apply `typo.*` first in `stylex.props`; local styles never spell ad-hoc
  fontSize/fontWeight — deliberate overrides (a glyph size, a 600 weight) get a comment.
- `src/theme/shared.ts` — cross-component styles (cards, form fields, buttons, filters,
  banners, dialogs, mono). Single-component styles live next to that component in a
  local `stylex.create`.
- `src/theme/global.css` — document base only: reset, `color-scheme: light dark`,
  `body` (13px base), `h1/h2/a/table` element defaults, and the `muted`/`error` text
  utilities, each with a dark-scheme media block mirroring the tokens. Nothing
  component-shaped goes here.

Hard-won rules:

- **Longhands only.** `background:` is silently dropped under the default
  `property-specificity` resolution — use `backgroundColor` (and longhand
  `borderColor`/`borderStyle`/`borderWidth`). `padding`/`margin` multi-value shorthands
  are fine.
- No descendant/attribute/sibling selectors. Base UI state styling goes through
  className **functions**: `className={(state) => stylex.props(s.x, state.checked && s.y).className ?? ""}`.
  Never spread `stylex.props(...)` onto a Base UI component (plain DOM elements only).
- Condition objects that cross a `StyleXStyles`-typed prop boundary need a `default`
  branch (`{ default: null, ":hover": … }`) or the type won't collapse.
- `<Select>` accepts `trigger?: stylex.StyleXStyles`; form fields pass
  `[field.input, field.selectTrigger]`.

## Design system

`DESIGN.md` (repo root) is the visual spec: the Linear design language — near-black
canvas (`#010102`), a surface ladder + 1px hairlines for depth (no drop shadows on page
surfaces), lavender-blue `#5e6ad2` as the **only** accent (brand mark, primary CTAs,
focus rings, links), Inter/system-sans, JetBrains Mono for code surfaces.

The shell is the Linear app idiom: a sidebar on the canvas beside a floating content
window (`src/components/Layout.tsx`). Semantic colors: success green for app on/off
state, lavender for selection, red/amber reserved for errors/warnings.
