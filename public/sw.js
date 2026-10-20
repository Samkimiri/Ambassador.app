// ==============================================================================
// SCDS AMBASSADOR HUB — OFFLINE-FIRST PROGRESSIVE WEB APP SERVICE WORKER
// Organization: Sam Creative Design School (SCDS)
// ==============================================================================

const CACHE_VERSION = "scds-ambassador-pwa-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGES_CACHE = `${CACHE_VERSION}-pages`;
const OFFLINE_FALLBACK_URL = "/offline";

const PRECACHE_ROUTES = [
  "/",
  "/offline",
  "/about",
  "/courses",
  "/join",
  "/ambassadors",
  "/auth/login",
  "/auth/register",
  "/dashboard",
  "/dashboard/referrals",
  "/dashboard/campaigns",
  "/dashboard/resources",
  "/dashboard/rewards",
  "/dashboard/leaderboard",
  "/dashboard/notifications",
  "/dashboard/profile",
  "/dashboard/support",
  "/admin",
  "/manifest.json",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(PAGES_CACHE).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_ROUTES.map((url) =>
          fetch(url, { credentials: "same-origin" })
            .then((res) => {
              if (res.ok) {
                return cache.put(url, res);
              }
            })
            .catch(() => null)
        )
      );
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(CACHE_VERSION))
            .map((oldKey) => caches.delete(oldKey))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // 1. Immutable / Static Next.js assets & icons -> Cache-First, then Network
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname === "/manifest.json"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
            }
            return response;
          })
          .catch(() => caches.match("/icon.svg"));
      })
    );
    return;
  }

  // 2. Next.js RSC / Data fetches & HTML Page Navigations -> Network-First with Stale/Offline Fallback
  if (
    request.mode === "navigate" ||
    request.headers.get("accept")?.includes("text/html") ||
    request.headers.get("RSC") === "1"
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(PAGES_CACHE).then((c) => c.put(request, clone));
            if (request.mode === "navigate" && url.search) {
              caches.open(PAGES_CACHE).then((c) => c.put(url.pathname, response.clone()));
            }
          }
          return response;
        })
        .catch(async () => {
          const exactMatch = await caches.match(request);
          if (exactMatch) return exactMatch;

          const pathMatch = await caches.match(url.pathname);
          if (pathMatch) return pathMatch;

          if (request.mode === "navigate") {
            const offlinePage = await caches.match(OFFLINE_FALLBACK_URL);
            if (offlinePage) return offlinePage;
            const rootPage = await caches.match("/");
            if (rootPage) return rootPage;
          }

          return new Response("Offline — SCDS Ambassador Hub", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          });
        })
    );
    return;
  }

  // 3. Default Stale-While-Revalidate for all other same-origin GET requests
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});

