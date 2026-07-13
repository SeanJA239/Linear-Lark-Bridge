/// The typed data-fetching hooks: tayori (SWR over the Hey API SDK) bound to
/// the generated client types. `useData(sdkFn, arg)` derives the SWR key from
/// the SDK function + its argument, so keys can never drift from the request.

import { tayori } from "tayori";
import type { Options } from "../sdk";
import type { RequestResult } from "../sdk/client";

export const { useData, useDataImmutable, useMutation, TayoriProvider } =
  tayori<Options, RequestResult>();
