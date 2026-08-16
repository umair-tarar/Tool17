import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { supabase } from "@/lib/supabase";

type AccessStatus = "pending" | "approved" | "rejected" | "revoked";
type Activity = { action: string; created_at: string };
type PaymentProvider = "visa_card" | "nayapay" | "easypaisa" | "jazzcash";
type PaymentReview = {
  id: string;
  user_id: string;
  package_id: string;
  credit_amount: number;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  provider_reference: string;
  manual_transaction_reference: string | null;
  manual_note: string | null;
  rejection_reason: string | null;
  created_at: string;
  submitted_at: string | null;
  status: string;
  user?: { email: string; full_name: string | null } | null;
};
type PaymentInstruction = {
  provider: PaymentProvider;
  display_name: string;
  account_identifier: string;
  instructions: string;
  account_holder: string | null;
  active: boolean;
};
const paymentProviderDefaults: Record<PaymentProvider, string> = {
  visa_card: "Visa / Debit Bank Card",
  nayapay: "NayaPay",
  easypaisa: "Easypaisa",
  jazzcash: "JazzCash",
};

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  access_status: AccessStatus;
  created_at: string;
  credits: { used: number; remaining: number } | null;
  activity: Activity[];
};

export default function Admin() {
  const navigate = useNavigate();
  const { profile, loading } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [updatingAccessUserId, setUpdatingAccessUserId] = useState<string | null>(null);
  const [paymentReviews, setPaymentReviews] = useState<PaymentReview[]>([]);
  const [paymentInstructions, setPaymentInstructions] = useState<PaymentInstruction[]>([]);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    if (!loading && profile?.role !== "admin") navigate("/dashboard", { replace: true });
  }, [loading, profile, navigate]);

  useEffect(() => {
    if (profile?.role !== "admin") return;

    const loadUsers = async () => {
      const [
        { data: profiles, error: profilesError },
        { data: credits, error: creditsError },
        { data: loginActivity, error: loginActivityError },
        { data: resetActivity, error: resetActivityError },
      ] = await Promise.all([
        supabase.from("profiles").select("id,email,full_name,role,access_status,created_at").order("created_at", { ascending: false }),
        supabase.from("credits").select("user_id,used,remaining"),
        supabase.from("login_activity").select("user_id,action,created_at").order("created_at", { ascending: false }),
        supabase.from("credit_reset_activity").select("target_user_id,action,created_at").order("created_at", { ascending: false }),
      ]);

      if (profilesError || creditsError || loginActivityError || resetActivityError) {
        const error = profilesError || creditsError || loginActivityError || resetActivityError;
        console.error("Failed to load admin data", error);
        setErrorMessage(error?.message ?? "Unable to load admin data.");
        return;
      }

      const creditMap = new Map((credits ?? []).map((credit) => [credit.user_id, credit]));
      const activityMap = new Map<string, Activity[]>();
      (loginActivity ?? []).forEach((event) => {
        activityMap.set(event.user_id, [...(activityMap.get(event.user_id) ?? []), { action: event.action, created_at: event.created_at }]);
      });
      (resetActivity ?? []).forEach((event) => {
        activityMap.set(event.target_user_id, [...(activityMap.get(event.target_user_id) ?? []), { action: event.action, created_at: event.created_at }]);
      });
      activityMap.forEach((events, userId) => {
        activityMap.set(userId, events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      });
      setUsers((profiles ?? []).map((user) => ({
        ...user,
        credits: creditMap.get(user.id) ?? null,
        activity: activityMap.get(user.id) ?? [{ action: "registration", created_at: user.created_at }],
      })));
    };

    loadUsers();

    const activityChannel = supabase
      .channel("admin-login-activity")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "login_activity" }, loadUsers)
      .subscribe();

    return () => {
      supabase.removeChannel(activityChannel);
    };
  }, [profile]);

  const loadPaymentData = async () => {
    const [{ data: purchases, error: purchasesError }, { data: instructions, error: instructionsError }] = await Promise.all([
      supabase.from("purchases").select("id,user_id,package_id,credit_amount,amount,currency,provider,provider_reference,manual_transaction_reference,manual_note,rejection_reason,created_at,submitted_at,status,user:profiles!purchases_user_id_fkey(email,full_name)").in("status", ["pending_payment", "submitted_for_review", "rejected", "fulfilled"]).order("created_at", { ascending: false }),
      supabase.from("payment_instructions").select("provider,display_name,account_identifier,instructions,account_holder,active").order("provider"),
    ]);
    if (purchasesError || instructionsError) {
      setReviewError((purchasesError || instructionsError)?.message ?? "Unable to load payment review data.");
      return;
    }
    setPaymentReviews((purchases ?? []).map((purchase) => ({ ...purchase, user: Array.isArray(purchase.user) ? purchase.user[0] ?? null : purchase.user })) as PaymentReview[]);
    setPaymentInstructions((instructions ?? []) as PaymentInstruction[]);
  };

  useEffect(() => {
    if (profile?.role === "admin") void loadPaymentData();
  }, [profile]);

  const approvePayment = async (purchaseId: string) => {
    if (!window.confirm("Approve this manual payment and add its credits?")) return;
    const { error } = await supabase.rpc("approve_manual_payment", { target_purchase_id: purchaseId });
    if (error) setReviewError(error.message);
    else await loadPaymentData();
  };

  const rejectPayment = async (purchaseId: string) => {
    const reason = window.prompt("Rejection reason");
    if (!reason?.trim()) return;
    const { error } = await supabase.rpc("reject_manual_payment", { target_purchase_id: purchaseId, reason });
    if (error) setReviewError(error.message);
    else await loadPaymentData();
  };

  const saveInstruction = async (instruction: PaymentInstruction) => {
    const isComplete = Boolean(instruction.display_name.trim() && instruction.account_identifier.trim() && instruction.instructions.trim());
    if (instruction.active && !isComplete) {
      setReviewError("Active payment instructions require a display name, receiving account or number, and payment instructions.");
      return;
    }
    setReviewError("");
    const payload = { ...instruction, updated_by: profile?.id, updated_at: new Date().toISOString() };
    const { error } = await supabase.from("payment_instructions").upsert(payload, { onConflict: "provider" });
    if (error) {
      console.error("Failed to save payment instructions", { provider: instruction.provider, error });
      setReviewError(error.message);
    } else {
      await loadPaymentData();
    }
  };

  const updateAccess = async (userId: string, status: Exclude<AccessStatus, "pending">) => {
    const confirmation = {
      approved: "Approve access for this user?",
      rejected: "Reject access for this user?",
      revoked: "Revoke access for this user?",
    }[status];
    if (!window.confirm(confirmation)) return;

    setErrorMessage("");
    setUpdatingAccessUserId(userId);
    const { data, error } = await supabase.rpc("manage_user_access", { target_user_id: userId, new_status: status });
    setUpdatingAccessUserId(null);

    if (error) {
      console.error("Failed to update user access", { userId, status, error });
      setErrorMessage(error.message);
      return;
    }

    if (!data) {
      setErrorMessage("The access function did not return updated profile data.");
      return;
    }

    setUsers((currentUsers) => currentUsers.map((user) => (
      user.id === userId
        ? { ...user, access_status: data.access_status, activity: [{ action: `access_${status}`, created_at: new Date().toISOString() }, ...user.activity] }
        : user
    )));
  };

  const resetCredits = async (userId: string) => {
    if (!window.confirm("Reset credits for this user? Their credits will be restored to 200,000.")) return;

    setErrorMessage("");
    setResettingUserId(userId);
    const { data, error } = await supabase.rpc("reset_user_credits", { target_user_id: userId });
    setResettingUserId(null);

    if (error) {
      console.error("Failed to reset user credits", { userId, error });
      setErrorMessage(error.message);
      return;
    }

    if (!data) {
      const message = "The reset function did not return updated credit data.";
      console.error("Failed to reset user credits", { userId, message });
      setErrorMessage(message);
      return;
    }

    setUsers((currentUsers) => currentUsers.map((user) => (
      user.id === userId ? { ...user, credits: { used: data.used, remaining: data.remaining } } : user
    )));
  };

  if (loading || profile?.role !== "admin") {
    return <main className="grid min-h-screen place-items-center bg-[#f7f9fc] text-sm text-[#71809d]">Checking access...</main>;
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#17223b]">
      <header className="bg-gradient-to-r from-[#263bd0] to-[#182a9f] px-5 py-5 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15"><ShieldCheck size={20} /></span>
            <div>
              <p className="text-sm font-extrabold">Admin Dashboard</p>
              <p className="text-[11px] text-blue-200">Admin-only user access and credit activity</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <Link to="/dashboard" className="flex items-center gap-1 rounded-lg px-3 py-2 hover:bg-white/10"><ArrowLeft size={14} /> Back to Workspace</Link>
            <button onClick={() => supabase.auth.signOut().then(() => navigate("/login"))} className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20"><LogOut size={14} /> Log out</button>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-7xl space-y-8 p-5 sm:p-8">
        <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#5266cc]">Payment settings</p>
          <h2 className="mt-1 text-2xl font-extrabold">Manual payment instructions</h2>
          <p className="mt-2 text-sm text-[#71809d]">Only active instructions are visible to authenticated users. Never store PINs, OTPs, passwords, CVVs, card numbers, or banking login credentials.</p>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {(["visa_card", "nayapay", "easypaisa", "jazzcash"] as PaymentProvider[]).map((provider) => {
              const current = paymentInstructions.find((item) => item.provider === provider) ?? { provider, display_name: paymentProviderDefaults[provider], account_identifier: "", instructions: "", account_holder: "", active: false };
              const update = (change: Partial<PaymentInstruction>) => setPaymentInstructions((items) => [...items.filter((item) => item.provider !== provider), { ...current, ...change }]);
              const isComplete = Boolean(current.display_name.trim() && current.account_identifier.trim() && current.instructions.trim());
              return <div key={provider} className="rounded-xl border border-slate-200 bg-[#fbfcff] p-4"><div className="flex items-center justify-between"><h3 className="font-extrabold">{paymentProviderDefaults[provider]}</h3><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={current.active} onChange={(event) => update({ active: event.target.checked })} /> Active</label></div>{current.active && !isComplete && <p role="alert" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Configuration is incomplete. Add a display name, receiving account or number, and payment instructions before users can create requests.</p>}<div className="mt-4 grid gap-3"><button type="button" onClick={() => void saveInstruction(current)} className="rounded-lg bg-[#3349be] px-3 py-2 text-xs font-bold text-white hover:bg-[#263aa5]">Save instructions</button><input value={current.display_name} onChange={(event) => update({ display_name: event.target.value })} placeholder="Display name" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input value={current.account_identifier} onChange={(event) => update({ account_identifier: event.target.value })} placeholder="Receiving account or number" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input value={current.account_holder ?? ""} onChange={(event) => update({ account_holder: event.target.value })} placeholder="Optional account holder" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /><textarea value={current.instructions} onChange={(event) => update({ instructions: event.target.value })} placeholder="Payment instructions" className="min-h-20 rounded-lg border border-slate-200 px-3 py-2 text-sm" /><button type="button" onClick={() => saveInstruction(current)} className="rounded-lg bg-[#263bd0] px-3 py-2 text-xs font-bold text-white">Save instructions</button></div></div>;
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#5266cc]">Payment review</p>
          <h2 className="mt-1 text-2xl font-extrabold">Manual payment submissions</h2>
          {reviewError && <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{reviewError}</p>}
          <div className="mt-5 space-y-3">{paymentReviews.length === 0 ? <p className="text-sm text-[#71809d]">No payment submissions yet.</p> : paymentReviews.map((payment) => <article key={payment.id} className="rounded-xl border border-slate-200 p-4"><div className="grid gap-3 text-sm md:grid-cols-4"><div><p className="text-[10px] uppercase text-slate-400">User</p><p className="font-bold">{payment.user?.full_name || payment.user?.email || payment.user_id}</p><p className="text-xs text-slate-500">{payment.user?.email}</p></div><div><p className="text-[10px] uppercase text-slate-400">Purchase</p><p className="font-bold">{payment.package_id} · {payment.credit_amount.toLocaleString()} credits</p><p className="text-xs text-slate-500">{payment.amount} {payment.currency} · {payment.provider}</p></div><div><p className="text-[10px] uppercase text-slate-400">Transaction reference</p><p className="break-all font-bold">{payment.manual_transaction_reference || "Not submitted"}</p><p className="text-xs text-slate-500">{payment.submitted_at ? new Date(payment.submitted_at).toLocaleString() : new Date(payment.created_at).toLocaleString()}</p></div><div><p className="text-[10px] uppercase text-slate-400">Status</p><p className="font-bold">{payment.status}</p>{payment.manual_note && <p className="mt-1 text-xs text-slate-500">Note: {payment.manual_note}</p>}{payment.rejection_reason && <p className="mt-1 text-xs text-rose-600">Reason: {payment.rejection_reason}</p>}</div></div>{payment.status === "submitted_for_review" && <div className="mt-4 flex gap-2"><button type="button" onClick={() => approvePayment(payment.id)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Approve and fulfill</button><button type="button" onClick={() => rejectPayment(payment.id)} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white">Reject</button></div>}</article>)}</div>
        </div>
        <div>
          <p className="text-xs font-semibold text-[#71809d]">Overview</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">All users</h1>
        </div>
        {errorMessage && <p role="alert" className="mb-5 rounded-lg bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{errorMessage}</p>}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-slate-200 bg-[#f7f9ff] text-[10px] uppercase tracking-wider text-[#71809d]">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Access Status</th>
                <th className="px-5 py-4">Joined</th>
                <th className="px-5 py-4">Credits used</th>
                <th className="px-5 py-4">Remaining</th>
                <th className="px-5 py-4">Latest activity</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const latest = user.activity[0];
                const isResetting = resettingUserId === user.id;
                const isUpdatingAccess = updatingAccessUserId === user.id;
                const isSelf = user.id === profile.id;
                return (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-bold text-[#243653]">{user.full_name || "Unnamed user"}</td>
                    <td className="px-5 py-4 text-[#71809d]">{user.email}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${user.role === "admin" ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700"}`}>{user.role}</span></td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${user.access_status === "approved" ? "bg-emerald-50 text-emerald-700" : user.access_status === "pending" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>{user.access_status}</span></td>
                    <td className="px-5 py-4 text-[#71809d]">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-4 font-bold text-[#243653]">{(user.credits?.used ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-4 font-bold text-emerald-600">{(user.credits?.remaining ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-4 text-[#71809d]">{latest ? `${latest.action} · ${new Date(latest.created_at).toLocaleString()}` : "No activity"}</td>
                    <td className="space-y-2 px-5 py-4">
                      {!isSelf && user.access_status !== "approved" && <button type="button" onClick={() => updateAccess(user.id, "approved")} disabled={isUpdatingAccess} className="mr-2 rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">Approve</button>}
                      {!isSelf && user.access_status === "pending" && <button type="button" onClick={() => updateAccess(user.id, "rejected")} disabled={isUpdatingAccess} className="mr-2 rounded-lg bg-rose-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60">Reject</button>}
                      {!isSelf && user.access_status === "approved" && <button type="button" onClick={() => updateAccess(user.id, "revoked")} disabled={isUpdatingAccess} className="mr-2 rounded-lg bg-amber-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60">Revoke Access</button>}
                      <button type="button" onClick={() => resetCredits(user.id)} disabled={isResetting} className="rounded-lg bg-[#263bd0] px-3 py-2 text-[10px] font-bold text-white hover:bg-[#182a9f] disabled:cursor-not-allowed disabled:opacity-60">{isResetting ? "Resetting..." : "Reset Credits"}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
