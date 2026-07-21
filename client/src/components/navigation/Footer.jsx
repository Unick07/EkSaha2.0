import { ArrowUpRight, Github, Linkedin, Send } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { BrandLogo } from "../common/BrandLogo";

export default function Footer() {
  const subscribe = (event) => { event.preventDefault(); event.currentTarget.reset(); toast.success("You're on the list."); };
  return <footer className="border-t border-border bg-surface-raised">
    <div className="container-shell py-16">
      <div className="grid gap-12 lg:grid-cols-[1.3fr_.7fr_.7fr_1.2fr]">
        <div><BrandLogo /><p className="mt-5 max-w-xs text-sm leading-6 text-muted">The flexible digital and IT team built for ambitious small businesses.</p><div className="mt-6 flex gap-2"><a className="icon-button size-10" href="#"><Linkedin size={17} /></a><a className="icon-button size-10" href="#"><Github size={17} /></a></div></div>
        <div><h3 className="text-sm font-bold">Company</h3><div className="mt-5 space-y-3 text-sm text-slate-500"><Link className="block" to="/about">About</Link><Link className="block" to="/insights">Insights</Link><Link className="block" to="/contact">Contact</Link></div></div>
        <div><h3 className="text-sm font-bold">Services</h3><div className="mt-5 space-y-3 text-sm text-slate-500"><Link className="block" to="/services/seo">SEO</Link><Link className="block" to="/services/web">Web</Link><Link className="block" to="/services/ads">Advertising</Link><Link className="block" to="/services/it-support">IT support</Link></div></div>
        <div><h3 className="text-sm font-bold">Useful ideas, no noise.</h3><p className="mt-3 text-sm leading-6 text-muted">A monthly field note on digital growth and resilient operations.</p><form onSubmit={subscribe} className="mt-5 flex gap-2"><input required type="email" className="input min-w-0" placeholder="you@company.com" /><button className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90"><Send size={17} /></button></form></div>
      </div>
      <div className="mt-14 flex flex-col gap-4 border-t border-slate-200 pt-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-white/10"><span>&copy; {new Date().getFullYear()} EkSaha. All rights reserved.</span><div className="flex gap-5"><a href="#">Privacy</a><a href="#">Terms</a><a className="flex items-center gap-1" href="/contact">Status <ArrowUpRight size={12} /></a></div></div>
    </div>
  </footer>;
}
