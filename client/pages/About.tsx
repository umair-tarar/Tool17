import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";

const steps = [
  ["01", "Create your account", "Register your PureListVerifier account."],
  ["02", "Get approved", "Your account is reviewed and approved by an administrator."],
  ["03", "Start verifying", "Access your workspace and start verifying email addresses."],
] as const;

const reasons = [
  [MailCheck, "Clear verification results", "Review email verification outcomes in a focused workspace built for clean, readable data."],
  [CreditCard, "Visible usage", "Keep credit usage visible while you work through your verification tasks."],
  [ShieldCheck, "Responsible access", "Administrator-controlled access and activity visibility help keep the workspace protected."],
] as const;

export default function About() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fcfcff] text-[#152446]">
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_86%_15%,rgba(174,190,255,.46),transparent_22%),linear-gradient(180deg,#f9faff_0%,#fdfdff_100%)]">
        <div className="absolute left-1/2 top-20 -z-10 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-100/40 blur-3xl" />
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-5 pb-20 pt-32 text-center sm:px-8 sm:pt-44 sm:pb-24">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-bold text-[#4053bc] shadow-sm">
            <ShieldCheck size={14} /> Built for cleaner data
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-.05em] text-[#102044] sm:text-6xl">
            About <span className="bg-gradient-to-r from-[#364bc0] to-[#7466d5] bg-clip-text text-transparent">PureListVerifier</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600">
            We help teams validate email addresses, keep their data clean, and work with more confidence.
          </p>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#5266cc]">Our mission</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-.04em] text-[#142448] sm:text-4xl">Make every address count.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600">
              PureListVerifier is focused on one practical goal: making email verification easier to understand and manage. A clean list supports more confident outreach, clearer decisions, and better visibility into the data behind every send.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-gradient-to-br from-[#263aaf] to-[#5266cc] p-5 text-white shadow-lg shadow-indigo-200/60">
              <CheckCircle2 size={20} className="text-indigo-100" />
              <p className="mt-5 text-base font-extrabold">Focused verification</p>
              <p className="mt-2 text-xs leading-5 text-indigo-100">Keep address checks and results together in one workspace.</p>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-[#f3f5ff] p-5 text-[#24365e]">
              <BarChart3 size={20} className="text-[#5266cc]" />
              <p className="mt-5 text-base font-extrabold">Visible activity</p>
              <p className="mt-2 text-xs leading-5 text-slate-600">See the information you need to manage access and usage responsibly.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-indigo-100 bg-gradient-to-br from-[#f3f5ff] to-[#faf9ff] px-6 py-12 sm:px-10 lg:px-14">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#5266cc]">How it works</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-.04em] text-[#142448] sm:text-4xl">A clear path to your verification workspace.</h2>
          </div>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map(([number, title, text], index) => (
              <li key={number} className="relative">
                <span className="text-4xl font-extrabold tracking-[-.05em] text-[#a4afeb]">{number}</span>
                {index < steps.length - 1 && <span className="absolute left-16 right-0 top-6 hidden h-px bg-indigo-200 md:block" />}
                <h3 className="mt-4 text-lg font-extrabold text-[#1b2c50]">{title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#5266cc]">Why PureListVerifier</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-.04em] text-[#142448] sm:text-4xl">A practical workspace for responsible verification.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {reasons.map(([Icon, title, text]) => (
              <article key={title} className="rounded-xl border border-slate-200 bg-[#fcfcff] p-6 transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/60">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#edf0ff] text-[#4356c9]"><Icon size={20} /></span>
                <h3 className="mt-5 text-base font-extrabold text-[#1b2c50]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-[#1e328e] to-[#5349ad] px-6 py-14 text-center text-white shadow-xl shadow-indigo-200 sm:px-12">
          <h2 className="text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Ready to start verifying?</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-indigo-100">Create your account and request access to your PureListVerifier workspace.</p>
          <Link to="/access" className="shine-button mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-bold text-[#263b9e] shadow-sm transition hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#29398f]">Get Started <ArrowRight size={16} /></Link>
        </div>
      </section>
    </main>
  );
}
