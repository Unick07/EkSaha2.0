import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { plans } from "../data/siteData";

function AuthShell({ title, copy, children }) {
  return <div className="grid min-h-screen lg:grid-cols-2"><div className="hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between"><Link to="/" className="flex items-center gap-2.5 font-extrabold"><span className="grid size-9 place-items-center rounded-xl bg-electric">N</span>Nextexa Lab</Link><div><div className="max-w-lg text-4xl font-extrabold leading-tight">“The best extension of our team we could have asked for.”</div><div className="mt-6 text-sm text-slate-400">Maya Chen · Co-founder, Northstar</div></div><div className="text-xs text-slate-500">Trusted by 120+ ambitious teams</div></div><main className="flex items-center justify-center px-5 py-12"><div className="w-full max-w-md"><Link to="/" className="mb-10 flex items-center gap-2 font-extrabold lg:hidden"><span className="grid size-8 place-items-center rounded-lg bg-electric text-white">N</span>Nextexa Lab</Link><h1 className="text-3xl font-extrabold tracking-tight">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p>{children}</div></main></div>;
}

export function Login() {
  const [show, setShow] = useState(false); const { login, user } = useAuth(); const navigate = useNavigate();
  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  const submit = e => { e.preventDefault(); const email = new FormData(e.currentTarget).get("email"); login(email); toast.success("Welcome back."); navigate(email.startsWith("admin") ? "/admin" : "/dashboard"); };
  return <AuthShell title="Welcome back" copy="Sign in to manage your services, requests and account."><form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm font-semibold">Email<input name="email" required type="email" defaultValue="user@nextexa.dev" className="input mt-2"/></label><label className="block text-sm font-semibold">Password<div className="relative mt-2"><input required type={show ? "text" : "password"} defaultValue="password" className="input pr-12"/><button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-3.5 text-slate-400">{show ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label><div className="flex justify-end"><Link className="text-sm font-semibold text-electric" to="/forgot-password">Forgot password?</Link></div><Button className="w-full">Sign in <ArrowRight size={16}/></Button><button type="button" className="w-full rounded-xl border border-slate-200 py-3 text-sm font-bold dark:border-white/10">Continue with Google</button></form><p className="mt-7 text-center text-sm text-slate-500">New to Nextexa? <Link to="/signup" className="font-bold text-electric">Create an account</Link></p></AuthShell>;
}

export function Signup() {
  const [step, setStep] = useState(1); const [selected, setSelected] = useState("Growth"); const navigate = useNavigate(); const { login } = useAuth();
  const submit = e => { e.preventDefault(); const email = new FormData(e.currentTarget).get("email"); login(email); toast.success("Your workspace is ready."); navigate("/dashboard"); };
  return <AuthShell title={step === 1 ? "Choose your starting point" : "Create your account"} copy="You can switch plans or service priorities whenever your business needs change.">{step === 1 ? <div className="mt-8 space-y-3">{plans.map(plan => <button onClick={() => setSelected(plan.name)} className={`w-full rounded-2xl border p-5 text-left transition ${selected === plan.name ? "border-electric bg-blue-50 ring-4 ring-blue-500/10 dark:bg-blue-500/10" : "border-slate-200 dark:border-white/10"}`} key={plan.name}><div className="flex items-center justify-between"><span className="font-bold">{plan.name}</span><span className="font-extrabold">${plan.monthly}/mo</span></div><p className="mt-1 text-xs text-slate-500">{plan.description}</p></button>)}<Button onClick={() => setStep(2)} className="mt-3 w-full">Continue with {selected}<ArrowRight size={16}/></Button></div> : <form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm font-semibold">Full name<input required className="input mt-2" placeholder="Jordan Lee"/></label><label className="block text-sm font-semibold">Work email<input name="email" required type="email" className="input mt-2" placeholder="you@company.com"/></label><label className="block text-sm font-semibold">Password<input required type="password" minLength="8" className="input mt-2" placeholder="At least 8 characters"/></label><div className="rounded-xl bg-slate-50 p-4 text-sm dark:bg-white/5"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 size={16} className="text-emerald-500"/>{selected} plan selected</div></div><Button className="w-full">Create account</Button><button type="button" onClick={() => setStep(1)} className="w-full text-sm font-semibold text-slate-500">Back to plans</button></form>}<p className="mt-7 text-center text-sm text-slate-500">Already have an account? <Link className="font-bold text-electric" to="/login">Sign in</Link></p></AuthShell>;
}

export function ForgotPassword() {
  const submit = e => { e.preventDefault(); toast.success("Password reset link sent."); };
  return <AuthShell title="Reset your password" copy="Enter your email and we’ll send a secure reset link."><form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm font-semibold">Email<input required type="email" className="input mt-2" placeholder="you@company.com"/></label><Button className="w-full">Send reset link</Button></form><Link className="mt-6 block text-center text-sm font-bold text-electric" to="/login">Back to sign in</Link></AuthShell>;
}

export function ResetPassword() {
  const { token } = useParams(); const navigate = useNavigate();
  const submit = e => { e.preventDefault(); toast.success("Password updated."); navigate("/login"); };
  return <AuthShell title="Set a new password" copy={`Create a secure new password for this account${token ? "." : ""}`}><form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm font-semibold">New password<input required minLength="8" type="password" className="input mt-2"/></label><label className="block text-sm font-semibold">Confirm password<input required minLength="8" type="password" className="input mt-2"/></label><Button className="w-full">Update password</Button></form></AuthShell>;
}
