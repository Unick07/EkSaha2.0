import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "../../components/common/ui";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/http/api";
import { homeForRole } from "../../lib/roles";
import { AuthShell } from "./index";

const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyEmail() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  if (!user) return <Navigate to="/login" replace />;
  if (user.emailVerified) return <Navigate to={homeForRole(user.role)} replace />;

  const submit = async (event) => {
    event.preventDefault();
    if (code.length !== 6) {
      toast.error("Enter the 6-digit code from your email.");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/auth/verify-email", { token: code });
      login(data);
      toast.success("Email verified.");
      navigate(data.planId ? homeForRole(data.role) : "/signup?step=2&google=true");
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not verify that code.");
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    try {
      await api.post("/auth/resend-verification");
      toast.success("A new code is on its way.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not resend the code.");
    }
  };

  return <AuthShell title="Verify your email" copy={`We sent a verification code to ${user.email}`}>
    <form onSubmit={submit} className="mt-8 space-y-5">
      <label className="block text-sm font-semibold">Verification code
        <input
          name="code"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          className="input mt-2 text-center text-2xl font-bold tracking-[0.5em]"
          placeholder="000000"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
        />
      </label>
      <Button disabled={submitting} className="w-full">Verify email</Button>
      <button type="button" onClick={resend} disabled={cooldown > 0} className="soft-button w-full disabled:opacity-50">
        {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
      </button>
    </form>
  </AuthShell>;
}
