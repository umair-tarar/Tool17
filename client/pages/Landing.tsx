import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  LockKeyhole,
  MailCheck,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { useLayoutEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import SiteHeader, { Brand } from "@/components/SiteHeader";

const features = [
  ["Fast verification", "Verify email addresses quickly and efficiently with clear, easy-to-read results.", MailCheck],
  ["Secure access", "Admin-controlled account approval helps keep the workspace protected.", LockKeyhole],
  ["Credit-based usage", "Keep verification usage visible with a clear credit system for every account.", CreditCard],
  ["Activity tracking", "Maintain visibility into account access and verification activity.", BarChart3],
] as const;

const steps = [
  ["01", "Create your account", "Register your PureListVerifier account."],
  ["02", "Get approved", "Your account is reviewed and approved by an administrator."],
  ["03", "Start verifying", "Access your workspace and start verifying email addresses."],
] as const;

function WorkspacePreview() {
  return <div className="relative mx-auto w-full max-w-[570px]" aria-label="Preview of the PureListVerifier verification workspace">
    <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-indigo-100 via-sky-50 to-violet-100 blur-2xl" />
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_60px_rgba(38,55,120,0.16)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#eff2ff] text-[#4558cc]"><ShieldCheck size={15} /></span><span className="text-xs font-bold text-[#172448]">Verification workspace</span></div>
        <span className="rounded-full bg-[#eefaf3] px-2.5 py-1 text-[10px] font-bold text-emerald-700">Workspace ready</span>
      </div>
      <div className="grid gap-3 bg-[#fbfcff] p-4 sm:grid-cols-[1fr_150px] sm:p-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verify an address</p><FileCheck2 size={15} className="text-[#5869d8]" /></div>
          <div className="mt-4 rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-400">name@company.com</div>
          <div className="mt-3 flex items-center justify-between rounded-lg bg-[#eefaf3] px-3 py-2.5"><div className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-600" /><span className="text-xs font-semibold text-emerald-800">Valid address</span></div><span className="text-[10px] font-bold text-emerald-600">Verified</span></div>
          <div className="mt-2 flex items-center justify-between rounded-lg bg-[#fff5f5] px-3 py-2.5"><div className="flex items-center gap-2"><span className="grid h-4 w-4 place-items-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-600">×</span><span className="text-xs font-semibold text-rose-800">Invalid address</span></div><span className="text-[10px] font-bold text-rose-600">Flagged</span></div>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl bg-[#263aaf] p-4 text-white shadow-sm"><p className="text-[10px] font-semibold text-indigo-100">Available credits</p><p className="mt-2 text-2xl font-extrabold tracking-tight">200,000</p><div className="mt-3 h-1.5 rounded-full bg-white/20"><div className="h-full w-4/5 rounded-full bg-[#aab9ff]" /></div></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Latest results</p><div className="mt-3 space-y-2 text-xs"><div className="flex justify-between"><span className="text-slate-500">Valid</span><span className="font-bold text-emerald-600">84%</span></div><div className="flex justify-between"><span className="text-slate-500">Invalid</span><span className="font-bold text-rose-600">11%</span></div></div></div>
        </div>
      </div>
    </div>
  </div>;
}

export default function Landing() {
  const location = useLocation();
  useLayoutEffect(() => {
    const section = location.hash && document.getElementById(location.hash.slice(1));
    if (section) section.scrollIntoView({ behavior: "auto" });
    else window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.hash, location.pathname]);

  return <main className="min-h-screen overflow-hidden bg-[#fcfcff] text-[#152446]">
    <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_86%_15%,rgba(174,190,255,.46),transparent_22%),linear-gradient(180deg,#f9faff_0%,#fdfdff_100%)]">
      <div className="absolute left-1/2 top-20 -z-10 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-100/40 blur-3xl" />
      <SiteHeader />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-32 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:pb-28 lg:pt-44">
        <div className="max-w-2xl"><div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-bold text-[#4053bc] shadow-sm"><BadgeCheck size={14} /> Email verification, thoughtfully managed</div><h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-[-.05em] text-[#102044] sm:text-5xl lg:text-[58px]">Verify Emails.<br />Clean Your Data.<br /><span className="bg-gradient-to-r from-[#364bc0] to-[#7466d5] bg-clip-text text-transparent">Work Smarter.</span></h1><p className="mt-6 max-w-xl text-base leading-7 text-slate-600">A fast, reliable email verification workspace built to help you validate email addresses, manage your credits, and keep your data clean.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link to="/access" className="shine-button inline-flex items-center justify-center gap-2 rounded-full bg-[#3349be] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-[#263aa5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5164d8] focus-visible:ring-offset-2">Get Started Free <ArrowRight size={16} /></Link><Link to="/access" className="shine-button inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-[#27385f] shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5164d8] focus-visible:ring-offset-2">Login</Link></div><p className="mt-5 flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 size={15} className="text-emerald-600" /> Account access is reviewed before workspace access is granted.</p></div>
        <WorkspacePreview />
      </div>
    </section>
    <section id="features" className="scroll-mt-16 border-y border-slate-100 bg-white px-5 py-20 sm:px-8"><div className="mx-auto max-w-7xl"><div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#5266cc]">Built for clean data</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-.04em] text-[#142448] sm:text-4xl">Everything you need for more confident outreach.</h2></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{features.map(([title, text, Icon]) => <article key={title} className="rounded-xl border border-slate-200 bg-[#fcfcff] p-6 transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/60"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#edf0ff] text-[#4356c9]"><Icon size={20} /></span><h3 className="mt-5 text-base font-extrabold text-[#1b2c50]">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}</div></div></section>
    <section id="how-it-works" className="scroll-mt-16 px-5 py-20 sm:px-8"><div className="mx-auto max-w-7xl rounded-3xl border border-indigo-100 bg-gradient-to-br from-[#f3f5ff] to-[#faf9ff] px-6 py-12 sm:px-10 lg:px-14"><div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#5266cc]">How it works</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-.04em] text-[#142448] sm:text-4xl">A clear path to your verification workspace.</h2></div><ol className="mt-12 grid gap-8 md:grid-cols-3">{steps.map(([number, title, text], index) => <li key={number} className="relative"><span className="text-4xl font-extrabold tracking-[-.05em] text-[#a4afeb]">{number}</span>{index < steps.length - 1 && <span className="absolute left-16 right-0 top-6 hidden h-px bg-indigo-200 md:block" />}<h3 className="mt-4 text-lg font-extrabold text-[#1b2c50]">{title}</h3><p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">{text}</p></li>)}</ol></div></section>
    <section className="border-y border-slate-100 bg-white px-5 py-20 sm:px-8"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#5266cc]">Designed for responsible access</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-.04em] text-[#142448] sm:text-4xl">A protected workspace, with visibility at every step.</h2><p className="mt-5 max-w-lg text-sm leading-7 text-slate-600">PureListVerifier pairs secure authentication with administrator-controlled access, clear credit usage, and activity visibility.</p></div><div className="grid gap-3 sm:grid-cols-2">{[[ShieldCheck,"Secure authentication"],[UserRoundCheck,"Admin-controlled access"],[LockKeyhole,"Protected workspace"],[UsersRound,"Activity tracking"]].map(([Icon, label]) => { const TrustIcon = Icon as typeof ShieldCheck; return <div key={label as string} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-[#fcfcff] p-4"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#edf0ff] text-[#4356c9]"><TrustIcon size={18} /></span><span className="text-sm font-bold text-[#24365e]">{label as string}</span></div>; })}</div></div></section>
    <section className="px-5 py-20 sm:px-8"><div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-[#1e328e] to-[#5349ad] px-6 py-14 text-center text-white shadow-xl shadow-indigo-200 sm:px-12"><h2 className="text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Ready to start verifying?</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-indigo-100">Create your account and get access to your PureListVerifier workspace.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/access" className="shine-button inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#263b9e] shadow-sm transition hover:bg-indigo-50">Create Your Account <ArrowRight size={16} /></Link><Link to="/access" className="shine-button inline-flex items-center justify-center rounded-full border border-white/30 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-white/10">Login</Link></div></div></section>
    <footer className="border-t border-slate-200 bg-white px-5 py-10 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-7 sm:flex-row sm:items-end sm:justify-between"><div><Link to="/"><Brand light={false} /></Link><p className="mt-3 max-w-md text-xs leading-5 text-slate-500">A focused email verification workspace for cleaner data and more confident outreach.</p></div><div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-600"><Link to="/#how-it-works" className="hover:text-[#3349be]">How It Works</Link><Link to="/#features" className="hover:text-[#3349be]">Features</Link><Link to="/access" className="hover:text-[#3349be]">Login</Link><Link to="/contact" className="hover:text-[#3349be]">Contact</Link></div></div><p className="mx-auto mt-8 max-w-7xl border-t border-slate-100 pt-5 text-xs text-slate-400">© 2026 PureListVerifier. All rights reserved.</p></footer>
  </main>;
}
