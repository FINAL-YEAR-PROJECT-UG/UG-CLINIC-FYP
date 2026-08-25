"use client";

import { useEffect } from "react";

/**
 * ServiceWorkerProvider
 *
 * Registers /public/sw.js on first mount. Placed in the root layout so it
 * runs once across the entire app (not per-page).
 *
 * Features:
 * - Registers sw.js silently; never throws if SW isn't supported
 * - In development mode the SW is skipped to avoid stale caching during hot-reload
 * - On update, the new SW activates as soon as all existing tabs close
 */
export default function ServiceWorkerProvider() {
  useEffect(() => {
    // Skip in dev (hot-reload would conflict with cache-first strategy)
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          // updateViaCache: 'none' ensures the browser always fetches the SW
          // from the network, not from the HTTP cache — so updates are instant.
          updateViaCache: "none",
        });

        // Check for updates every 5 minutes
        const interval = setInterval(() => {
          registration.update().catch(() => undefined);
        }, 5 * 60_000);

        return () => clearInterval(interval);
      } catch (err) {
        // Silently swallow — SW is a progressive enhancement
        console.warn("[SW] Registration failed:", err);
      }
    };

    void register();
  }, []);

  // This component renders nothing — it's purely a side-effect runner
  return null;
}
