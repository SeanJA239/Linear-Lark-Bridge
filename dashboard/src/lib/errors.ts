/// `unknown` → user-facing message for errors thrown by the SDK / tayori.
///
/// With `throwOnError`, the client throws the *parsed error body* on a non-2xx:
/// the host's JSON `{ "error": "..." }`, or a plain-text message from the
/// App-contributed routes. Response-validation failures throw `ZodError`;
/// transport failures throw regular `Error`s (ky timeout, network).

import { isZodError } from "tayori";
import { prettifyError } from "zod";

export function errMessage(e: unknown): string {
  if (typeof e === "string" && e) return e;
  if (
    typeof e === "object" &&
    e !== null &&
    "error" in e &&
    typeof e.error === "string"
  ) {
    return e.error;
  }
  if (isZodError(e)) {
    return `server sent unexpected data: ${prettifyError(e).split("\n")[0]}`;
  }
  if (e instanceof Error) return e.message;
  return String(e);
}
