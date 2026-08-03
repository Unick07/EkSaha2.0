import { useEffect, useRef } from "react";

export const TURNSTILE_SITE_KEY = "0x4AAAAAAED7c8FyFvurV0V8";

// The script tag in index.html loads with `render=explicit`, so widgets are
// never auto-scanned into the DOM - each instance renders itself here and
// tears itself down on unmount, which is what makes it safe to mount two of
// these at once (e.g. the Contact page also renders the Footer newsletter
// widget) without them fighting over the same auto-render pass.
export default function Turnstile({ onVerify }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const render = () => {
      if (cancelled || !containerRef.current || widgetIdRef.current != null) return;
      if (!window.turnstile) {
        window.setTimeout(render, 150);
        return;
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        size: "flexible",
        callback: (token) => onVerify(token),
        "expired-callback": () => onVerify(""),
        "error-callback": () => onVerify(""),
      });
    };
    render();

    return () => {
      cancelled = true;
      if (window.turnstile && widgetIdRef.current != null) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="cf-turnstile w-full" data-sitekey={TURNSTILE_SITE_KEY}/>;
}
