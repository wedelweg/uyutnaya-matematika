export async function verifyOffline(
  reg: ServiceWorkerRegistration,
): Promise<boolean> {
  const worker = reg.active;
  if (!worker) return false;
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => {
      channel.port1.close();
      resolve(false);
    }, 6000);
    channel.port1.onmessage = (e) => {
      clearTimeout(timer);
      channel.port1.close();
      resolve(e.data?.complete === true);
    };
    worker.postMessage({ type: "VERIFY_OFFLINE" }, [channel.port2]);
  });
}
export async function registerPwa(
  onStatus: (ready: boolean) => void,
  onUpdate: (registration: ServiceWorkerRegistration) => void,
) {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
  try {
    const base = new URL(import.meta.env.BASE_URL, location.origin);
    const reg = await navigator.serviceWorker.register(new URL("sw.js", base), {
      scope: base.pathname,
    });
    // A different PWA at the site's root may already control this document.
    // Wait for our own registration, not navigator.serviceWorker.ready.
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("Service worker activation timeout"));
      }, 20000);
      const workers = new Set<ServiceWorker>();
      const check = () => {
        if (reg.active?.state === "activated") {
          cleanup();
          resolve();
          return;
        }
        const worker = reg.installing ?? reg.waiting;
        if (worker && !workers.has(worker)) {
          workers.add(worker);
          worker.addEventListener("statechange", check);
        }
      };
      const cleanup = () => {
        clearTimeout(timer);
        reg.removeEventListener("updatefound", check);
        workers.forEach((w) => w.removeEventListener("statechange", check));
      };
      reg.addEventListener("updatefound", check);
      check();
    });
    onStatus(await verifyOffline(reg));
    if (reg.waiting) onUpdate(reg);
    reg.addEventListener("updatefound", () => {
      reg.installing?.addEventListener("statechange", () => {
        if (reg.waiting && navigator.serviceWorker.controller) onUpdate(reg);
      });
    });
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      void verifyOffline(reg).then(onStatus);
    });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) void verifyOffline(reg).then(onStatus);
    });
    return reg;
  } catch {
    onStatus(false);
  }
}
