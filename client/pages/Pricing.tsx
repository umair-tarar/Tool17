import { Check, CreditCard, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import { useAuth } from "@/lib/AuthProvider";
import { supabase } from "@/lib/supabase";

type Plan = {
  id: string;
  slug: "basic" | "standard" | "premium";
  name: string;
  monthly_price: number;
  currency: string;
  credits_per_period: number;
  is_featured: boolean;
};

type Provider = "visa_card" | "nayapay" | "easypaisa" | "jazzcash";
type Instruction = { display_name: string; account_identifier: string; instructions: string; account_holder: string | null };

const providers: Array<{ id: Provider; name: string }> = [
  { id: "visa_card", name: "Visa / Debit Bank Card" },
  { id: "nayapay", name: "NayaPay" },
  { id: "easypaisa", name: "Easypaisa" },
  { id: "jazzcash", name: "JazzCash" },
];

export default function Pricing() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [instruction, setInstruction] = useState<Instruction | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [transactionReference, setTransactionReference] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const loadPlans = async () => {
      const { data, error: plansError } = await supabase
        .from("subscription_plans")
        .select("id,slug,name,monthly_price,currency,credits_per_period,is_featured")
        .eq("active", true)
        .order("monthly_price");
      if (plansError) {
        setError("Subscription plans are temporarily unavailable.");
        return;
      }
      const nextPlans = (data ?? []) as Plan[];
      setPlans(nextPlans);
      const requestedPlan = searchParams.get("plan");
      setSelectedPlan(nextPlans.find((plan) => plan.slug === requestedPlan) ?? null);
    };
    void loadPlans();
  }, [searchParams]);

  const chooseProvider = async (provider: Provider) => {
    setSelectedProvider(provider);
    setInstruction(null);
    setError("");
    const { data, error: instructionError } = await supabase
      .from("payment_instructions")
      .select("display_name,account_identifier,instructions,account_holder")
      .eq("provider", provider)
      .eq("active", true)
      .single();
    if (instructionError || !data) {
      setError("This payment method is not currently available.");
      return;
    }
    setInstruction(data as Instruction);
  };

  const createPayment = async () => {
    if (!selectedPlan || !selectedProvider || !user) return;
    setBusy(true);
    setError("");
    const { data, error: createError } = await supabase.rpc("create_subscription_manual_payment", {
      requested_plan_slug: selectedPlan.slug,
      requested_provider: selectedProvider,
    });
    setBusy(false);
    if (createError || !data) {
      setError(createError?.message ?? "Unable to create the payment request.");
      return;
    }
    setPaymentId(data.id);
    setPaymentStatus(data.status);
  };

  const submitPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!paymentId) return;
    setBusy(true);
    setError("");
    const { data, error: submitError } = await supabase.rpc("submit_subscription_manual_payment", {
      target_payment_id: paymentId,
      submitted_transaction_reference: transactionReference,
      submitted_note: note || null,
    });
    setBusy(false);
    if (submitError || !data) {
      setError(submitError?.message ?? "Unable to submit the payment for review.");
      return;
    }
    setPaymentStatus(data.status);
  };

  return <main className="min-h-screen bg-[#f7f9fc] pb-16 text-[#17223b]">
    <SiteHeader />
    <section className="mx-auto max-w-6xl px-5 pb-12 pt-32 sm:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#5266cc]">Monthly subscriptions</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-.05em] text-[#142448] sm:text-5xl">Choose a plan that fits your list volume.</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">Every plan is billed monthly and includes credits for email verification. Manual payment approval is required before a subscription becomes active.</p>
      </div>
      {error && <p role="alert" className="mx-auto mt-6 max-w-xl rounded-xl bg-rose-50 px-4 py-3 text-center text-sm font-semibold text-rose-700">{error}</p>}
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {plans.map((plan) => <article key={plan.id} className={`relative rounded-2xl border bg-white p-6 shadow-sm ${selectedPlan?.id === plan.id ? "border-indigo-500 ring-2 ring-indigo-100" : "border-slate-200"}`}>
          {plan.is_featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#3349be] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Most Popular</span>}
          <p className="text-sm font-bold text-[#5266cc]">{plan.name}</p>
          <p className="mt-4 text-4xl font-extrabold">${Number(plan.monthly_price).toFixed(0)}<span className="text-base font-semibold text-slate-500">/month</span></p>
          <p className="mt-3 text-xl font-bold text-[#26385f]">{plan.credits_per_period.toLocaleString()} credits</p>
          <p className="mt-2 text-sm text-slate-500">Monthly Plan</p>
          <div className="mt-6 flex items-center gap-2 text-sm text-slate-600"><Check size={16} className="text-emerald-600" /> Credits reset on each approved renewal</div>
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-600"><Check size={16} className="text-emerald-600" /> Admin approval required</div>
          <button type="button" onClick={() => { setSelectedPlan(plan); setPaymentId(null); setPaymentStatus(null); }} className="mt-7 w-full rounded-full bg-[#3349be] px-4 py-3 text-sm font-bold text-white hover:bg-[#263aa5]">{selectedPlan?.id === plan.id ? "Selected" : `Select ${plan.name}`}</button>
        </article>)}
      </div>
    </section>
    {selectedPlan && <section className="mx-auto grid max-w-6xl gap-6 px-5 sm:px-8 lg:grid-cols-[.9fr_1.1fr]">
      <aside className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#5266cc]">Order summary</p><h2 className="mt-3 text-2xl font-extrabold">{selectedPlan.name} Plan</h2><dl className="mt-6 space-y-4 text-sm"><div className="flex justify-between"><dt className="text-slate-500">Credits</dt><dd className="font-bold">{selectedPlan.credits_per_period.toLocaleString()}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Billing</dt><dd className="font-bold">Monthly Plan</dd></div><div className="flex justify-between border-t border-slate-100 pt-4"><dt className="font-bold">Total</dt><dd className="text-lg font-extrabold">${Number(selectedPlan.monthly_price).toFixed(0)} {selectedPlan.currency}</dd></div></dl><p className="mt-6 rounded-xl bg-indigo-50 p-3 text-xs leading-5 text-indigo-800">Your subscription begins only after the submitted manual payment is approved. Account approval remains separate.</p></aside>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#5266cc]">Manual payment</p><h2 className="mt-3 text-2xl font-extrabold">Choose a payment method</h2>
        {!user ? <div className="mt-6 rounded-xl bg-indigo-50 p-5"><p className="text-sm leading-6 text-indigo-900">Sign in to submit a manual payment request. New customers can register first; access remains blocked until a payment and account approval are complete.</p><div className="mt-4 flex gap-3"><Link to="/login" className="rounded-full bg-[#3349be] px-4 py-2.5 text-sm font-bold text-white">Log in</Link><Link to={`/register?plan=${selectedPlan.slug}`} className="rounded-full border border-indigo-200 px-4 py-2.5 text-sm font-bold text-[#3349be]">Register</Link></div></div> : <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">{providers.map((provider) => <button key={provider.id} type="button" onClick={() => void chooseProvider(provider.id)} className={`rounded-xl border p-4 text-left text-sm font-bold ${selectedProvider === provider.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200"}`}>{provider.name}</button>)}</div>
          {instruction && <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm"><p className="font-extrabold">{instruction.display_name}</p>{instruction.account_holder && <p className="mt-2">Account holder: {instruction.account_holder}</p>}<p className="mt-2 break-all font-bold">{instruction.account_identifier}</p><p className="mt-3 whitespace-pre-wrap leading-6 text-slate-600">{instruction.instructions}</p></div>}
          {!paymentId ? <button type="button" disabled={!selectedProvider || !instruction || busy} onClick={() => void createPayment()} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#3349be] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><CreditCard size={16} /> {busy ? "Preparing…" : "Continue to payment"}</button> : paymentStatus === "submitted_for_review" ? <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800"><ShieldCheck className="mb-2" size={20} /> Payment submitted successfully. Your payment is pending administrator review.</div> : <form onSubmit={submitPayment} className="mt-6 space-y-4"><label className="block text-sm font-bold">Transaction ID / Reference Number<input required value={transactionReference} onChange={(event) => setTransactionReference(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal" /></label><label className="block text-sm font-bold">Optional note<textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-2 min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal" /></label><p className="text-xs text-slate-500">Never submit a PIN, OTP, password, CVV, card number, or banking login credentials.</p><button disabled={busy} className="w-full rounded-full bg-[#3349be] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Submitting…" : "Submit for approval"}</button></form>}
        </>}
      </section>
    </section>}
  </main>;
}
