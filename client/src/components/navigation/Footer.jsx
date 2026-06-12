import { ArrowUpRight, Github, Linkedin, Send } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function Footer() {
  const subscribe = (event) => { event.preventDefault(); event.currentTarget.reset(); toast.success("You're on the list."); };
  return <footer className="border-t border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-[#070b22]">
    <div className="container-shell py-16">
      <div className="grid gap-12 lg:grid-cols-[1.3fr_.7fr_.7fr_1.2fr]">
        <div><div className="flex items-center gap-2.5 font-extrabold"><span className="grid size-9 place-items-center rounded-xl bg-electric text-white">N</span>Nextexa Lab</div><p className="mt-5 max-w-xs text-sm leading-6 text-slate-500">The flexible digital and IT team built for ambitious small businesses.</p><div className="mt-6 flex gap-2"><a className="rounded-lg border p-2 dark:border-white/10" href="#"><Linkedin size={17} /></a><a className="rounded-lg border p-2 dark:border-white/10" href="#"><Github size={17} /></a></div></div>
        <div><h3 className="text-sm font-bold">Company</h3><div className="mt-5 space-y-3 text-sm text-slate-500"><Link className="block" to="/about">About</Link><Link className="block" to="/blog">Insights</Link><Link className="block" to="/contact">Contact</Link></div></div>
        <div><h3 className="text-sm font-bold">Services</h3><div className="mt-5 space-y-3 text-sm text-slate-500"><Link className="block" to="/services/seo">SEO</Link><Link className="block" to="/services/web">Web</Link><Link className="block" to="/services/ads">Advertising</Link><Link className="block" to="/services/it-support">IT support</Link></div></div>
        <div><h3 className="text-sm font-bold">Useful ideas, no noise.</h3><p className="mt-3 text-sm leading-6 text-slate-500">A monthly field note on digital growth and resilient operations.</p><form onSubmit={subscribe} className="mt-5 flex gap-2"><input required type="email" className="input min-w-0" placeholder="you@company.com" /><button className="grid size-12 shrink-0 place-items-center rounded-xl bg-electric text-white"><Send size={17} /></button></form></div>
      </div>
      <div className="mt-14 flex flex-col gap-4 border-t border-slate-200 pt-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-white/10"><span> {`© ${new Date().getFullYear()}`} Nextexa Lab. All rights reserved.</span><div className="flex gap-5"><a href="#">Privacy</a><a href="#">Terms</a><a className="flex items-center gap-1" href="/contact">Status <ArrowUpRight size={12} /></a></div></div>
    </div>
  </footer>;
}
