# crates/lark-kit

Shared toolkit for the Lark **Integration** apps (not the framework — the host never
depends on it). Source-agnostic; each integration composes these pieces with its own
source models. Raw Lark API surface belongs upstream in `larkoapi` (see *Lark API
Patterns* in the root `AGENTS.md`); this crate holds the Lark-flavored helpers that
compose it.

## Modules

- `card` — Lark card builders: `card`, `message`, `md_div`, `link_button` (JSON 1.0).
- `webhook` / `bot` — the group-webhook sender (`send_lark_card`) and the DM-capable
  `LarkBotClient`.
- `config` — per-app `LarkConfig` + `TomlLark`, including `apply_lark_app` to resolve a
  `lark_app = "<name>"` binding against `[lark-apps]` before the inline/env overlay.
- `slot` — `StateSlot`/`SlotGuard`/`Live`: the process-lifetime state cell that backs
  host-mounted ingress routers. Ingress routers are mounted once at startup, but an
  integration's `AppState` is rebuilt on every config reload — the running `Instance`
  stores into the slot on `run`, clears it via `SlotGuard` on stop, and handlers read the
  current state through the `Live` extractor (or return `503` while the app is down).
- `event` — the Lark event-callback scaffold (`event::classify`): AES-256-CBC decrypt,
  URL-verification challenge, token check, `url.preview.get` → `Callback`.
- `utils` — `verify_hmac_sha256`, `verify_standard_webhook`, `truncate`.
- `routing` — see below.

## Notification routing (`routing/`)

Console-configurable routing shared by the source integrations (github, gitlab, linear):
maps a *subject* (repo path / team key — each app defines its own) and an *event* string
to Lark `Destination`s (group chat by `chat_id`, DM by `open_id`/email). The ruleset is
one JSON blob in the per-App `StateStore` (key `KEY`), loaded fresh on every webhook —
console edits apply without a restart.

- `model` — `Config` (rules + defaults + `UserMap` + alert labels), `Rule`, `Destination`,
  `DestKind`; tolerant decode.
- `matcher` — `Config::destinations_for(subject, event)`: every matching rule contributes
  its destinations (union + dedup); defaults are used only when **no** rule matched the
  subject; wildcard-prefix and exact subject matching.
- `delivery` — `deliver`/`deliver_all`: card delivery through the bot (bot-only — no
  webhook fallback).
- `store` — load/save the blob (`Config::load` et al.).
- `validate` — `validate()` (shape) and `validate_for(&RoutingSpec)` (rejects unknown
  events and fields unsupported by the app's spec).
- `spec` — `RoutingSpec`: the static routing capabilities an App exposes to the console
  (`SubjectSpec` label/placeholder/help, the `RoutingEvent` vocabulary, and
  `RoutingFeatures` toggles — `user_map`, `alert_labels`, chat/user pickers). Presets:
  `RoutingFeatures::SOURCE_WITH_ALERTS`, `ROUTING_ONLY`.
- `admin` — `RoutingApi::new(store, spec).router(bots)`: the admin router an App mounts
  via `App::routes` (config GET/PUT + spec + chat/user pickers backed by the live bot).

When adding a routable event to an integration, extend that app's `RoutingSpec` event
vocabulary in the same change — `validate_for` rejects saves that mention unknown events.
