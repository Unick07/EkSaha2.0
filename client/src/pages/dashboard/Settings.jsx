import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../../components/common/ui";
import api from "../../services/http/api";
import { useAuth } from "../../hooks/useAuth";
import { PASSWORD_RULES, failedPasswordRules, passwordStrength } from "../../lib/password";

export default function Settings() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const strength = passwordStrength(newPassword);

  useEffect(() => {
    let active = true;
    api.get("/auth/me")
      .then(({ data }) => {
        if (active) {
          setProfile(data);
          login(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [login]);

  const saveProfile = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const { data: updated } = await api.patch("/users/me", { name: data.name, email: data.email });
      setProfile(updated);
      login(updated);
      toast.success("Profile settings saved.");
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not save profile settings.");
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (data.newPassword !== data.confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    const failedRules = failedPasswordRules(data.newPassword);
    if (failedRules.length > 0) {
      toast.error(`Password needs ${failedRules.map((rule) => rule.label).join(", ")}.`);
      return;
    }
    try {
      await api.patch("/users/me/password", { currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success("Password updated.");
      event.currentTarget.reset();
      setNewPassword("");
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not update password.");
    }
  };

  if (loading) return <div className="mx-auto max-w-3xl panel p-7 text-sm text-muted">Loading account settings...</div>;

  return <div className="mx-auto max-w-3xl space-y-6">
    <form onSubmit={saveProfile} className="panel p-7">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-6 dark:border-white/10">
        <span className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-xl font-bold text-primary-foreground dark:text-slate-950">{(profile?.name || "?").split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>
        <div><h2 className="font-bold">Profile details</h2><p className="text-sm text-slate-500">Keep your contact information current.</p></div>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-semibold">Full name<input name="name" required className="input mt-2" defaultValue={profile?.name}/></label>
        <label className="text-sm font-semibold">Email<input name="email" required type="email" className="input mt-2" defaultValue={profile?.email}/></label>
      </div>
      <div className="mt-8 flex justify-end"><Button>Save changes</Button></div>
    </form>

    <form onSubmit={changePassword} className="panel p-7">
      <h3 className="font-bold">Change password</h3>
      <p className="mt-1 text-sm text-slate-500">Choose a strong password you don't use anywhere else.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-semibold sm:col-span-2">Current password<input name="currentPassword" required type="password" className="input mt-2"/></label>
        <label className="text-sm font-semibold">New password
          <input name="newPassword" required type="password" minLength={8} className="input mt-2" value={newPassword} onChange={(event) => setNewPassword(event.target.value)}/>
          {newPassword && <div className="mt-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <div className={`h-full rounded-full transition-all ${strength.barColor}`} style={{ width: `${(strength.passed / PASSWORD_RULES.length) * 100}%` }} />
            </div>
            <div className={`mt-1.5 text-xs font-bold ${strength.textColor}`}>{strength.label}</div>
          </div>}
        </label>
        <label className="text-sm font-semibold">Confirm new password<input name="confirmPassword" required type="password" className="input mt-2"/></label>
      </div>
      <div className="mt-8 flex justify-end"><Button>Update password</Button></div>
    </form>
  </div>;
}
