import { useState } from "react";
import { ArrowUpRight, Send } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { BrandLogo } from "../common/BrandLogo";
import Turnstile from "../common/Turnstile";
import api from "../../services/http/api";
import { trackEvent } from "../../lib/analytics";
import { social } from "../../data/siteData";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);

  const subscribe = async (event) => {
    event.preventDefault();
    setSubscribing(true);
    try {
      const { data } = await api.post("/newsletter", { email, turnstileToken });
      trackEvent("newsletter_signup");
      toast.success(data?.message || "You're on the list.");
      setEmail("");
      setTurnstileToken("");
      setTurnstileKey((key) => key + 1);
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not subscribe. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  return <footer className="border-t border-border bg-surface-raised">
    <div className="container-shell py-16">
      <div className="grid gap-12 lg:grid-cols-[1.3fr_.7fr_.7fr_1.2fr]">
        <div><BrandLogo /><p className="mt-5 max-w-xs text-sm leading-6 text-muted">The flexible digital and IT team built for ambitious small businesses.</p><div className="mt-6 flex gap-2">{social.map(({ label, url, icon: Icon }) => <a key={label} className="icon-button size-10" href={url} target="_blank" rel="noopener noreferrer" aria-label={label}><Icon size={17} /></a>)}</div></div>
        <div><h3 className="text-sm font-bold">Company</h3><div className="mt-5 space-y-3 text-sm text-muted"><Link className="block" to="/about">About</Link><Link className="block" to="/insights">Insights</Link><Link className="block" to="/contact">Contact</Link></div></div>
        <div><h3 className="text-sm font-bold">Services</h3><div className="mt-5 space-y-3 text-sm text-muted"><Link className="block" to="/services/seo">SEO</Link><Link className="block" to="/services/web">Web</Link><Link className="block" to="/services/ads">Advertising</Link><Link className="block" to="/services/it-support">IT support</Link></div></div>
        <div><h3 className="text-sm font-bold">Useful ideas, no noise.</h3><p className="mt-3 text-sm leading-6 text-muted">A monthly field note on digital growth and resilient operations.</p><form onSubmit={subscribe} className="mt-5 space-y-3"><div className="flex gap-2"><input required type="email" className="input min-w-0" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} /><button disabled={subscribing || !turnstileToken} className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"><Send size={17} /></button></div><Turnstile key={turnstileKey} onVerify={setTurnstileToken}/></form></div>
      </div>
      <div className="mt-14 flex flex-col gap-4 border-t border-border pt-7 text-xs text-muted sm:flex-row sm:items-center sm:justify-between dark:border-white/10"><span> {`© ${new Date().getFullYear()}`} EkSaha. All rights reserved.</span><div className="flex gap-5"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><a className="flex items-center gap-1" href="/contact">Status <ArrowUpRight size={12} /></a></div></div>
    </div>
  </footer>;
}
