# x

X (Twitter) link previews for Lark. Preview-only — no notifications, no routing.

Flow: `POST /webhooks/x/lark/event` (`lark_kit::event::classify` handles
decrypt/challenge/token) → `source::XClient` fetches the tweet (fxtwitter → X API v2 →
oEmbed fallback chain; `X_BEARER_TOKEN` optional) → `cards::x_preview` reply card.

Like the other integrations: `from_toml` reads `[x]`, resolves an optional
`lark_app = "<name>"` binding, then overlays `[x.lark]` / env; `run` publishes live
`AppState` into the `lark_kit::StateSlot`; handlers read it via the `Live` extractor.
