export function trackEvent(eventName, params = {}) {
  try {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    window.gtag("event", eventName, params);
  } catch {
    // Analytics must never break the app - a blocked or missing gtag
    // (ad blockers, privacy extensions, GA not yet loaded) fails silently.
  }
}

export function trackPageView(path) {
  trackEvent("page_view", { page_path: path });
}
