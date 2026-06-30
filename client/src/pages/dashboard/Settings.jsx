import { useState } from "react";
import { CreditCard, Settings2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/common/ui";
import { Modal } from "../../components/dashboard/Modal";
import { useUserDashboardStore } from "../../store/useUserDashboardStore";

export default function Settings() {
  const [billingOpen, setBillingOpen] = useState(false);
  const { profile, paymentMethod, updateProfile, updatePaymentMethod } = useUserDashboardStore();
  const saveProfile = (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    updateProfile(data);
    toast.success("Profile settings saved.");
  };
  const savePayment = (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    updatePaymentMethod(data);
    setBillingOpen(false);
    toast.success("Payment method updated.");
  };

  return <div className="mx-auto max-w-3xl"><form onSubmit={saveProfile} className="panel p-7"><div className="flex items-center gap-4 border-b border-slate-100 pb-6 dark:border-white/10"><span className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-xl font-bold text-white">{profile.name.split(" ").map((part) => part[0]).join("").slice(0,2)}</span><div><h2 className="font-bold">Profile details</h2><p className="text-sm text-slate-500">Keep your contact information current.</p></div></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold">Full name<input name="name" className="input mt-2" defaultValue={profile.name}/></label><label className="text-sm font-semibold">Email<input name="email" type="email" className="input mt-2" defaultValue={profile.email}/></label><label className="text-sm font-semibold">Company<input name="company" className="input mt-2" defaultValue={profile.company}/></label><label className="text-sm font-semibold">Timezone<select name="timezone" className="input mt-2" defaultValue={profile.timezone}><option>Eastern Time (US)</option><option>Pacific Time (US)</option><option>UTC</option><option>Asia/Kathmandu</option></select></label></div><div className="mt-8 flex justify-end"><Button>Save changes</Button></div></form><div className="panel mt-6 p-7"><div className="flex gap-3"><CreditCard className="text-electric"/><div><h3 className="font-bold">Payment method</h3><p className="mt-1 text-sm text-slate-500">{paymentMethod.brand} ending in {paymentMethod.last4} | Expires {paymentMethod.expiry}</p></div></div><Button onClick={() => setBillingOpen(true)} variant="secondary" className="mt-5"><Settings2 size={16}/>Update billing</Button></div>
    <Modal open={billingOpen} onClose={() => setBillingOpen(false)} title="Update payment method"><form className="space-y-4" onSubmit={savePayment}><select name="brand" className="input" defaultValue={paymentMethod.brand}><option>Visa</option><option>Mastercard</option><option>American Express</option></select><input name="last4" required pattern="[0-9]{4}" maxLength="4" className="input" defaultValue={paymentMethod.last4} placeholder="Last four digits"/><input name="expiry" required className="input" defaultValue={paymentMethod.expiry} placeholder="MM/YY"/><Button className="w-full">Save payment method</Button></form></Modal>
  </div>;
}
