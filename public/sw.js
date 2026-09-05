// Service worker mínimo: solo lo justo para que la PWA sea instalable y
// funcione algo offline. Estrategia network-first — la red manda siempre
// que haya conexión, y solo se sirve de caché si la red falla. Con
// cache-first (versión anterior) un usuario que ya hubiera cargado una
// página se quedaba con esa versión para siempre, sin ver nunca los
// cambios de despliegues posteriores, aunque el servidor ya sirviera algo
// distinto (así se quedó "pegado" el temporizador desactivado para
// usuarios que habían visitado /test antes de activarlo en Configuración).
// La API nunca se cachea — los datos (preguntas, sesiones, estadísticas)
// deben venir siempre frescos del servidor.
const CACHE_NAME = "fir-turel-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let datos;
  try {
    datos = event.data.json();
  } catch {
    datos = { title: "FIR Turel", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(datos.title || "FIR Turel", {
      body: datos.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: datos.url || "/inicio" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/inicio";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existente = clients.find((c) => c.url.includes(url));
      if (existente) return existente.focus();
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return; // nunca cachear la API

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
