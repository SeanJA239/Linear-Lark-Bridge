/// Hand-written Hey API-shaped SDK for the standup App's admin route
/// (`/api/apps/standup/settings`), which is self-stated and absent from the
/// OpenAPI spec. The schema mirrors `SettingsWire` in
/// `apps/automations/standup/src/settings/`.

import { z } from "zod";
import { client, type Options } from "../sdk";
import type { RequestResult, TDataShape } from "../sdk/client";

export const zStandupSettings = z.object({
  timezone: z.string(),
  announce_time: z.string(),
  announce_enabled: z.boolean(),
  remind_evening_time: z.string(),
  remind_evening_enabled: z.boolean(),
  remind_morning_time: z.string(),
  remind_morning_enabled: z.boolean(),
  urgent_time: z.string(),
  urgent_enabled: z.boolean(),
  doc_title: z.string(),
  header_done: z.string(),
  header_plan: z.string(),
  header_block: z.string(),
  column_widths: z.array(z.number()),
  help_template: z.string(),
  check_template: z.string(),
  announce_title: z.string(),
  announce_body: z.string(),
  reminder_title: z.string(),
  reminder_body: z.string(),
});
export type StandupSettings = z.infer<typeof zStandupSettings>;

interface GetStandupSettingsData extends TDataShape {
  body?: never;
  path?: never;
  query?: never;
  url: "/api/apps/standup/settings";
}

/** `GET /api/apps/standup/settings` — the live settings blob (defaults when unset). */
export const getStandupSettings = <ThrowOnError extends boolean = true>(
  options?: Options<GetStandupSettingsData, ThrowOnError>,
): RequestResult<{ 200: StandupSettings }, unknown, ThrowOnError> =>
  (options?.client ?? client).get<
    { 200: StandupSettings },
    unknown,
    ThrowOnError
  >({
    responseValidator: (data) => zStandupSettings.parseAsync(data),
    url: "/api/apps/standup/settings",
    ...options,
  });

interface PutStandupSettingsData extends TDataShape {
  body: StandupSettings;
  path?: never;
  query?: never;
  url: "/api/apps/standup/settings";
}

/** `PUT /api/apps/standup/settings` — validate + persist, echoing the normalized settings. */
export const putStandupSettings = <ThrowOnError extends boolean = true>(
  options: Options<PutStandupSettingsData, ThrowOnError>,
): RequestResult<{ 200: StandupSettings }, unknown, ThrowOnError> =>
  (options.client ?? client).put<
    { 200: StandupSettings },
    unknown,
    ThrowOnError
  >({
    responseValidator: (data) => zStandupSettings.parseAsync(data),
    url: "/api/apps/standup/settings",
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
