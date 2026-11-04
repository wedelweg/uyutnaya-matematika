/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  getCacheKeyForURL,
} from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};
const manifest = self.__WB_MANIFEST;
precacheAndRoute(manifest);
cleanupOutdatedCaches();
clientsClaim();
const scopePath = new URL(self.registration.scope).pathname;
registerRoute(
  new NavigationRoute(
    createHandlerBoundToURL(
      new URL("index.html", self.registration.scope).pathname,
    ),
    {
      allowlist: [
        new RegExp(`^${scopePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
      ],
    },
  ),
);
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "VERIFY_OFFLINE")
    event.waitUntil(
      (async () => {
        let complete = manifest.length > 0;
        for (const entry of manifest) {
          const key = getCacheKeyForURL(
            new URL(entry.url, self.location.href).href,
          );
          const response = key ? await caches.match(key) : null;
          if (!response?.ok) {
            complete = false;
            break;
          }
        }
        event.ports[0]?.postMessage({ complete, count: manifest.length });
      })(),
    );
});
