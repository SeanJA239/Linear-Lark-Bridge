/// Live console event feed over SSE. EventSource has no fetch-style client, so
/// this stays outside the SDK — but the payload type (`Event`) and the level
/// vocabulary come from the generated spec types, so the shape can't drift.

import { useEffect, useRef, useState } from "react";
import type { Event as ControlEvent, Level } from "../sdk";
import { revalidateMe } from "./auth";

export type { ControlEvent, Level };

const MAX_EVENTS = 500;

export function useEvents(): {
  events: ControlEvent[];
  connected: boolean;
  laggedCount: number;
} {
  const [events, setEvents] = useState<ControlEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [laggedCount, setLaggedCount] = useState(0);
  const reconnectRef = useRef<number | null>(null);
  const failuresRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let src: EventSource | null = null;

    const connect = () => {
      if (cancelled) return;
      // The session cookie rides along on same-origin requests — no token.
      src = new EventSource("/api/events");
      src.onopen = () => {
        failuresRef.current = 0;
        setConnected(true);
      };
      src.onerror = () => {
        setConnected(false);
        src?.close();
        if (cancelled) return;
        // EventSource hides the HTTP status, so a 401 from a lapsed session is
        // indistinguishable from a transient drop and would reconnect forever.
        // After a few failures, re-probe /auth/me so the app gate can fall back
        // to login — mirroring the REST 401 path.
        failuresRef.current += 1;
        if (failuresRef.current === 3) {
          void revalidateMe();
        }
        reconnectRef.current = window.setTimeout(connect, 2000);
      };
      src.onmessage = (e) => {
        try {
          const ev = JSON.parse(e.data) as ControlEvent;
          setEvents((prev) => {
            const next = [...prev, ev];
            return next.length > MAX_EVENTS ? next.slice(-MAX_EVENTS) : next;
          });
        } catch {
          // ignore malformed
        }
      };
      src.addEventListener("lagged", (e) => {
        const n = Number((e as MessageEvent).data) || 0;
        setLaggedCount((c) => c + n);
      });
    };

    connect();
    return () => {
      cancelled = true;
      if (reconnectRef.current !== null) {
        window.clearTimeout(reconnectRef.current);
      }
      src?.close();
    };
  }, []);

  return { events, connected, laggedCount };
}
