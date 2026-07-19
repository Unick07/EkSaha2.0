import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/common/ui";
import { useAuth } from "../../hooks/useAuth";
import { plans } from "../../data/siteData";
import api from "../../services/http/api";
import { homeForRole } from "../../lib/roles";

const PASSWORD_RULES = [
  { test: (value) => value.length >= 8, label: "at least 8 characters" },
  { test: (value) => /[A-Z]/.test(value), label: "one uppercase letter" },
  { test: (value) => /[a-z]/.test(value), label: "one lowercase letter" },
  { test: (value) => /[0-9]/.test(value), label: "one number" },
  { test: (value) => /[!@#$%^&*]/.test(value), label: "one special character (!@#$%^&*)" },
];

const STRENGTH_LEVELS = [
  { label: "Weak", barColor: "bg-red-500", textColor: "text-red-600 dark:text-red-400" },
  { label: "Fair", barColor: "bg-amber-500", textColor: "text-amber-600 dark:text-amber-400" },
  { label: "Strong", barColor: "bg-blue-500", textColor: "text-blue-600 dark:text-blue-400" },
  { label: "Very Strong", barColor: "bg-emerald-500", textColor: "text-emerald-600 dark:text-emerald-400" },
];

function passwordStrength(value) {
  const passed = PASSWORD_RULES.filter((rule) => rule.test(value)).length;
  const level = STRENGTH_LEVELS[Math.max(0, Math.min(passed, 5) - 2)] || STRENGTH_LEVELS[0];
  return { passed, ...level };
}

function AuthShell({ title, copy, children }) {
  return <div className="grid min-h-screen bg-background text-text lg:grid-cols-2">
    <div className="hidden bg-surface p-12 lg:flex lg:flex-col lg:justify-between">
      <Link to="/" className="flex items-center gap-2.5 font-extrabold"><span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">E</span>EkSaha</Link>
      <div>
        <div className="max-w-lg text-4xl font-extrabold leading-tight">"The best extension of our team we could have asked for."</div>
        <div className="mt-6 text-sm text-muted">Maya Chen - Co-founder, Northstar</div>
      </div>
      <div className="text-xs text-muted">Trusted by 120+ ambitious teams</div>
    </div>
    <main className="flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-10 flex items-center gap-2 font-extrabold lg:hidden"><span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">E</span>EkSaha</Link>
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
        {children}
      </div>
    </main>
  </div>;
}

export function Login() {
  const [show, setShow] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to={homeForRole(user.role)} replace />;

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = form.get("email");
    const password = form.get("password");

    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("accessToken", data.accessToken);
      login(data.user);
      toast.success("Welcome back.");
      navigate(homeForRole(data.user.role));
    } catch {
      toast.error("Invalid email or password");
    }
  };

  return <AuthShell title="Welcome back" copy="Sign in to manage your services, requests and account.">
    <form onSubmit={submit} className="mt-8 space-y-5">
      <label className="block text-sm font-semibold">Email<input name="email" required type="email" className="input mt-2" /></label>
      <label className="block text-sm font-semibold">Password<div className="relative mt-2"><input name="password" required type={show ? "text" : "password"} className="input pr-12" /><button type="button" onClick={() => setShow(!show)} className="icon-button absolute right-2 top-1.5 size-9 rounded-xl border-0">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
      <div className="flex justify-end"><Link className="text-action" to="/forgot-password">Forgot password?</Link></div>
      <Button className="w-full">Sign in <ArrowRight size={16} /></Button>
      <button type="button" className="soft-button w-full">Continue with Google</button>
    </form>
    <p className="mt-7 text-center text-sm text-muted">New to EkSaha? <Link to="/signup" className="font-bold text-primary">Create an account</Link></p>
  </AuthShell>;
}

export function Signup() {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState("Growth");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const strength = passwordStrength(password);

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = form.get("name");
    const email = form.get("email");

    const failedRules = PASSWORD_RULES.filter((rule) => !rule.test(password));
    if (failedRules.length > 0) {
      toast.error(`Password needs ${failedRules.map((rule) => rule.label).join(", ")}.`);
      return;
    }

    try {
      const { data: availablePlans } = await api.get("/plans");
      const selectedPlan = availablePlans.find((plan) => plan.name === selected);
      const { data } = await api.post("/auth/signup", {
        name,
        email,
        password,
        planId: selectedPlan?.id || null,
      });
      localStorage.setItem("accessToken", data.accessToken);
      login(data.user);
      toast.success("Your workspace is ready.");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not create your account.");
    }
  };

  return <AuthShell title={step === 1 ? "Choose your starting point" : "Create your account"} copy="You can switch plans or service priorities whenever your business needs change.">
    {step === 1 ? <div className="mt-8 space-y-3">
      {plans.map((plan) => <button onClick={() => setSelected(plan.name)} className={`w-full rounded-2xl border p-5 text-left transition ${selected === plan.name ? "border-primary bg-primary/10 ring-4 ring-primary/15" : "border-border bg-surface hover:bg-surface-raised"}`} key={plan.name}>
        <div className="flex items-center justify-between"><span className="font-bold">{plan.name}</span><span className="font-extrabold">${plan.monthly}/mo</span></div>
        <p className="mt-1 text-xs text-muted">{plan.description}</p>
      </button>)}
      <Button onClick={() => setStep(2)} className="mt-3 w-full">Continue with {selected}<ArrowRight size={16} /></Button>
    </div> : <form onSubmit={submit} className="mt-8 space-y-5">
      <label className="block text-sm font-semibold">Full name<input name="name" required className="input mt-2" placeholder="Your full name" /></label>
      <label className="block text-sm font-semibold">Email<input name="email" required type="email" className="input mt-2" placeholder="your@email.com" /></label>
      <label className="block text-sm font-semibold">Password
        <input name="password" required type="password" minLength="8" className="input mt-2" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} />
        {password && <div className="mt-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div className={`h-full rounded-full transition-all ${strength.barColor}`} style={{ width: `${(strength.passed / PASSWORD_RULES.length) * 100}%` }} />
          </div>
          <div className={`mt-1.5 text-xs font-bold ${strength.textColor}`}>{strength.label}</div>
        </div>}
      </label>
      <div className="rounded-xl border border-border bg-surface-raised p-4 text-sm"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 size={16} className="text-emerald-500" />{selected} plan selected</div></div>
      <Button className="w-full">Create account</Button>
      <button type="button" onClick={() => setStep(1)} className="soft-button w-full">Back to plans</button>
    </form>}
    <p className="mt-7 text-center text-sm text-muted">Already have an account? <Link className="font-bold text-primary" to="/login">Sign in</Link></p>
  </AuthShell>;
}

export function ForgotPassword() {
  const submit = (event) => {
    event.preventDefault();
    toast.success("Password reset link sent.");
  };

  return <AuthShell title="Reset your password" copy="Enter your email and we will send a secure reset link.">
    <form onSubmit={submit} className="mt-8 space-y-5">
      <label className="block text-sm font-semibold">Email<input required type="email" className="input mt-2" placeholder="you@company.com" /></label>
      <Button className="w-full">Send reset link</Button>
    </form>
    <Link className="text-action mt-6 justify-center" to="/login">Back to sign in</Link>
  </AuthShell>;
}

export function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const submit = (event) => {
    event.preventDefault();
    toast.success("Password updated.");
    navigate("/login");
  };

  return <AuthShell title="Set a new password" copy={`Create a secure new password for this account${token ? "." : ""}`}>
    <form onSubmit={submit} className="mt-8 space-y-5">
      <label className="block text-sm font-semibold">New password<input required minLength="8" type="password" className="input mt-2" /></label>
      <label className="block text-sm font-semibold">Confirm password<input required minLength="8" type="password" className="input mt-2" /></label>
      <Button className="w-full">Update password</Button>
    </form>
  </AuthShell>;
}
