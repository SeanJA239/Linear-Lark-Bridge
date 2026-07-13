/// Cross-view cache invalidation. Every `useData` call that other views can
/// mutate declares a cache tag; mutations call `invalidate(...)` afterwards to
/// revalidate all of them, replacing the old string-key `mutate("/api/...")`.

import { unstable_mutateWithTags } from "tayori";

export type CacheTag = `#${string}`;

export const TAG_APPS = "#apps" as const;
export const TAG_STATUS = "#status" as const;
export const TAG_LARK_APPS = "#lark-apps" as const;
export const TAG_CONSOLE_AUTH = "#console-auth" as const;
export const TAG_CONFIG = "#config" as const;
export const TAG_LINEAR_SETTINGS = "#linear-settings" as const;
export const TAG_LINEAR_USER_MAP = "#linear-user-map" as const;
export const TAG_STANDUP_SETTINGS = "#standup-settings" as const;

/// Per-app routing-config tag (`RoutingEditor` is mounted once per app).
export function routingTag(app: string): CacheTag {
  return `#routing:${app}`;
}

export function invalidate(...tags: CacheTag[]): Promise<unknown> {
  return unstable_mutateWithTags(tags);
}
