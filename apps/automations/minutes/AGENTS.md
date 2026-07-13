# minutes

Auto-transcribe Lark/Feishu recorded meetings and post digest cards. Uses `larkoapi` for
all Lark API surface.

Pipeline: VC `meeting_ended` / `recording_ready` event → fetch recording → STT →
summarize → interactive card + optional Lark Doc attachment. Action: `process-meeting`
(params: `meeting_id`, optional `owner`/`url`).

## Key modules

- `events.rs` — Lark VC event subscription dispatch
- `pipeline.rs` — end-to-end orchestration
- `stt/{whisper_api,whisper_cpp}.rs` — selected via feature flag (`whisper-api` default,
  `whisper-cpp` opt-in)
- `lark/{card,docs}.rs` — digest card builder + Lark Docs attachment
- `app.rs` — `App`/`Instance` impl; `run::serve_ws(cancel)`, `actions::handle(...)`

Config via `figment` + env vars; see `README.md` in this directory.
