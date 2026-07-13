/// Hand-written Hey API-shaped SDK for the shared routing admin API
/// (`lark_kit::routing::RoutingApi`), mounted per App under `/api/apps/<app>/`.
/// App-contributed routes are self-stated and absent from the OpenAPI spec by
/// design, so these can't be generated — the zod schemas mirror
/// `lark_kit::routing::{Config, RoutingSpec}` and validate responses exactly
/// like the generated SDK does. Same shape as `sdk.gen.ts`, so the tayori
/// hooks (`useData`/`useMutation`) consume them identically.

import { z } from "zod";
import { client, type Options } from "../sdk";
import type { RequestResult, TDataShape } from "../sdk/client";

// ── Wire schemas (lark_kit::routing::model) ──────────────────────────────────

export const zDestination = z.object({
  kind: z.enum(["chat", "dm"]),
  target: z.string(),
});
export type Destination = z.infer<typeof zDestination>;
export type DestKind = Destination["kind"];

export const zRule = z.object({
  match: z.string(),
  events: z.array(z.string()),
  destinations: z.array(zDestination),
});
export type Rule = z.infer<typeof zRule>;

export const zRoutingUserMap = z.object({
  username: z.string(),
  lark_email: z.string(),
});
export type RoutingUserMap = z.infer<typeof zRoutingUserMap>;

export const zRoutingConfig = z.object({
  rules: z.array(zRule),
  default_destinations: z.array(zDestination),
  user_map: z.array(zRoutingUserMap),
  alert_labels: z.array(z.string()),
});
export type RoutingConfig = z.infer<typeof zRoutingConfig>;

export const zRoutingSpec = z.object({
  namespace: z.string(),
  subject: z.object({
    label: z.string(),
    placeholder: z.string(),
    help: z.string(),
  }),
  events: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
      description: z.string(),
    }),
  ),
  features: z.object({
    user_map: z.boolean(),
    alert_labels: z.boolean(),
    chat_picker: z.boolean(),
    user_picker: z.boolean(),
  }),
});
export type RoutingSpec = z.infer<typeof zRoutingSpec>;

export const zChatInfo = z.object({ chat_id: z.string(), name: z.string() });
export type ChatInfo = z.infer<typeof zChatInfo>;

export const zUserInfo = z.object({ open_id: z.string(), name: z.string() });
export type UserInfo = z.infer<typeof zUserInfo>;

// ── SDK functions ────────────────────────────────────────────────────────────

interface AppPathData extends TDataShape {
  body?: never;
  path: { app: string };
  query?: never;
}

interface GetRoutingSpecData extends AppPathData {
  url: "/api/apps/{app}/routing/spec";
}

/** `GET /api/apps/{app}/routing/spec` — the App's static routing capabilities. */
export const getRoutingSpec = <ThrowOnError extends boolean = true>(
  options: Options<GetRoutingSpecData, ThrowOnError>,
): RequestResult<{ 200: RoutingSpec }, unknown, ThrowOnError> =>
  (options.client ?? client).get<{ 200: RoutingSpec }, unknown, ThrowOnError>({
    responseValidator: (data) => zRoutingSpec.parseAsync(data),
    url: "/api/apps/{app}/routing/spec",
    ...options,
  });

interface GetRoutingData extends AppPathData {
  url: "/api/apps/{app}/routing";
}

/** `GET /api/apps/{app}/routing` — the current routing config (defaults when unset). */
export const getRouting = <ThrowOnError extends boolean = true>(
  options: Options<GetRoutingData, ThrowOnError>,
): RequestResult<{ 200: RoutingConfig }, unknown, ThrowOnError> =>
  (options.client ?? client).get<{ 200: RoutingConfig }, unknown, ThrowOnError>(
    {
      responseValidator: (data) => zRoutingConfig.parseAsync(data),
      url: "/api/apps/{app}/routing",
      ...options,
    },
  );

interface PutRoutingData extends TDataShape {
  body: RoutingConfig;
  path: { app: string };
  query?: never;
  url: "/api/apps/{app}/routing";
}

/** `PUT /api/apps/{app}/routing` — validate + persist, echoing the saved config. */
export const putRouting = <ThrowOnError extends boolean = true>(
  options: Options<PutRoutingData, ThrowOnError>,
): RequestResult<{ 200: RoutingConfig }, unknown, ThrowOnError> =>
  (options.client ?? client).put<{ 200: RoutingConfig }, unknown, ThrowOnError>(
    {
      responseValidator: (data) => zRoutingConfig.parseAsync(data),
      url: "/api/apps/{app}/routing",
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    },
  );

interface ListRoutingChatsData extends AppPathData {
  url: "/api/apps/{app}/chats";
}

/** `GET /api/apps/{app}/chats` — the bot's group chats (503 while the App is down). */
export const listRoutingChats = <ThrowOnError extends boolean = true>(
  options: Options<ListRoutingChatsData, ThrowOnError>,
): RequestResult<{ 200: ChatInfo[] }, unknown, ThrowOnError> =>
  (options.client ?? client).get<{ 200: ChatInfo[] }, unknown, ThrowOnError>({
    responseValidator: (data) => z.array(zChatInfo).parseAsync(data),
    url: "/api/apps/{app}/chats",
    ...options,
  });

interface ListRoutingUsersData extends AppPathData {
  url: "/api/apps/{app}/users";
}

/** `GET /api/apps/{app}/users` — the users the bot can DM (503 while the App is down). */
export const listRoutingUsers = <ThrowOnError extends boolean = true>(
  options: Options<ListRoutingUsersData, ThrowOnError>,
): RequestResult<{ 200: UserInfo[] }, unknown, ThrowOnError> =>
  (options.client ?? client).get<{ 200: UserInfo[] }, unknown, ThrowOnError>({
    responseValidator: (data) => z.array(zUserInfo).parseAsync(data),
    url: "/api/apps/{app}/users",
    ...options,
  });
