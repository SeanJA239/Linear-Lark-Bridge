/// Hand-written Hey API-shaped SDK for the linear App's admin routes
/// (`/api/apps/linear/settings` + `/api/apps/linear/user-map`), which are
/// self-stated and absent from the OpenAPI spec. Schemas mirror the wire
/// structs in `apps/integrations/linear/src/db/{settings,user_map}/routes.rs`.

import { z } from "zod";
import { client, type Options } from "../sdk";
import type { RequestResult, TDataShape } from "../sdk/client";

// ── Behavior settings ────────────────────────────────────────────────────────

export const zLinearSettings = z.object({
  subscriber_on_comment: z.boolean(),
  subscriber_on_status_change: z.boolean(),
  subscriber_on_any_update: z.boolean(),
  reminders_enabled: z.boolean(),
  reminder_recipients: z.enum(["assignee", "assignee_and_subscribers"]),
  reminder_lead_days: z.array(z.number()),
  reminder_overdue_max_days: z.number(),
  reminder_check_interval_hours: z.number(),
  reminder_timezone: z.string(),
});
export type LinearSettings = z.infer<typeof zLinearSettings>;

interface GetLinearSettingsData extends TDataShape {
  body?: never;
  path?: never;
  query?: never;
  url: "/api/apps/linear/settings";
}

/** `GET /api/apps/linear/settings` — subscriber fan-out + reminder knobs. */
export const getLinearSettings = <ThrowOnError extends boolean = true>(
  options?: Options<GetLinearSettingsData, ThrowOnError>,
): RequestResult<{ 200: LinearSettings }, unknown, ThrowOnError> =>
  (options?.client ?? client).get<
    { 200: LinearSettings },
    unknown,
    ThrowOnError
  >({
    responseValidator: (data) => zLinearSettings.parseAsync(data),
    url: "/api/apps/linear/settings",
    ...options,
  });

interface PutLinearSettingsData extends TDataShape {
  body: LinearSettings;
  path?: never;
  query?: never;
  url: "/api/apps/linear/settings";
}

/** `PUT /api/apps/linear/settings` — validate + persist, echoing the saved settings. */
export const putLinearSettings = <ThrowOnError extends boolean = true>(
  options: Options<PutLinearSettingsData, ThrowOnError>,
): RequestResult<{ 200: LinearSettings }, unknown, ThrowOnError> =>
  (options.client ?? client).put<
    { 200: LinearSettings },
    unknown,
    ThrowOnError
  >({
    responseValidator: (data) => zLinearSettings.parseAsync(data),
    url: "/api/apps/linear/settings",
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

// ── User map (Linear → Lark email overrides) ─────────────────────────────────

export const zUserMapping = z.object({
  linear_email: z.string(),
  lark_email: z.string(),
  lark_open_id: z.string().nullable(),
  note: z.string().nullable(),
  updated_by: z.string().nullable(),
  updated_at: z.number(),
});
export type UserMapping = z.infer<typeof zUserMapping>;

interface ListUserMapData extends TDataShape {
  body?: never;
  path?: never;
  query?: never;
  url: "/api/apps/linear/user-map";
}

/** `GET /api/apps/linear/user-map` — every mapping row. */
export const listUserMap = <ThrowOnError extends boolean = true>(
  options?: Options<ListUserMapData, ThrowOnError>,
): RequestResult<{ 200: UserMapping[] }, unknown, ThrowOnError> =>
  (options?.client ?? client).get<
    { 200: UserMapping[] },
    unknown,
    ThrowOnError
  >({
    responseValidator: (data) => z.array(zUserMapping).parseAsync(data),
    url: "/api/apps/linear/user-map",
    ...options,
  });

interface UpsertUserMapData extends TDataShape {
  body: {
    linear_email: string;
    lark_email: string;
    lark_open_id?: string | null;
    note?: string | null;
  };
  path?: never;
  query?: never;
  url: "/api/apps/linear/user-map";
}

/** `POST /api/apps/linear/user-map` — create/replace one mapping (keyed by `linear_email`). */
export const upsertUserMap = <ThrowOnError extends boolean = true>(
  options: Options<UpsertUserMapData, ThrowOnError>,
): RequestResult<{ 200: UserMapping }, unknown, ThrowOnError> =>
  (options.client ?? client).post<{ 200: UserMapping }, unknown, ThrowOnError>({
    responseValidator: (data) => zUserMapping.parseAsync(data),
    url: "/api/apps/linear/user-map",
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

interface DeleteUserMapData extends TDataShape {
  body?: never;
  path: { linear_email: string };
  query?: never;
  url: "/api/apps/linear/user-map/{linear_email}";
}

/** `DELETE /api/apps/linear/user-map/{linear_email}` — 204, or 404 when absent. */
export const deleteUserMap = <ThrowOnError extends boolean = true>(
  options: Options<DeleteUserMapData, ThrowOnError>,
): RequestResult<{ 204: undefined }, unknown, ThrowOnError> =>
  (options.client ?? client).delete<{ 204: undefined }, unknown, ThrowOnError>({
    url: "/api/apps/linear/user-map/{linear_email}",
    ...options,
  });
