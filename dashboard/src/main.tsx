import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { SWRConfig } from "swr";
import { App } from "./App.tsx";
import { revalidateMe } from "./lib/auth.ts";
import { TayoriProvider } from "./lib/tayori.ts";
import { createClient } from "./sdk/client";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root element");
}

createRoot(root).render(
  <StrictMode>
    <TayoriProvider
      initClient={() =>
        // Same-origin console: no baseUrl, the session rides in the cookie.
        createClient({
          throwOnError: true,
          credentials: "same-origin",
          kyOptions: {
            // Single-operator admin console: surface failures, don't retry
            // them silently (SWR-level retry is off too, in the SWRConfig).
            retry: 0,
            hooks: {
              afterResponse: [
                // A 401 means the session lapsed — re-probe /auth/me so the
                // app gate falls back to the login screen. The request still
                // throws for its own caller.
                (_request, _options, response) => {
                  if (response.status === 401) void revalidateMe();
                  return response;
                },
              ],
            },
          },
        })
      }
    >
      {/* Single-operator admin console: no refetch-on-focus or silent retries —
          surface errors instead. Merges into TayoriProvider's inner SWRConfig. */}
      <SWRConfig
        value={{ revalidateOnFocus: false, shouldRetryOnError: false }}
      >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SWRConfig>
    </TayoriProvider>
  </StrictMode>,
);
