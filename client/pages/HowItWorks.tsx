import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileUp,
  FolderCheck,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";

const steps = [
  ["01", "Create Your Account", "Register for a PureListVerifier account to begin the access process.", UserPlus],
  ["02", "Get Approved", "An administrator reviews your access request before the verification workspace becomes available.", ShieldCheck],
  ["03", "Access Your Workspace", "Once approved, sign in through the access page to open your verification workspace.", FolderCheck],
  ["04", "Upload Your List", "Choose a CSV, XLSX, or XLS file from your workspace to prepare your list for verification.", FileUp],
  ["05", "Review Verification Results", "View the results in your workspace and see the available outcomes for the addresses in your list.", ClipboardCheck],
  ["06", "Download Results", "Download a CSV report or separated workbook when your verification results are ready.", Download],
] as const;

export default function HowItWorks() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fcfcff] text-[#152446]">
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_86%_15%,rgba(174,190,255,.46),transparent_22%),linear-gradient(180deg,#f9faff_0%,#fdfdff_100%)]">
        <div className="absolute left-1/2 top-20 -z-10 h-[440px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-100/40 blur-3xl" />
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-5 pb-20 pt-32 text-center sm:px-8 sm:pb-24 sm:pt-44">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-bold text-[#4053bc] shadow-sm">
            <CheckCircle2 size={14} /> Your verification workflow
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-.05em] text-[#102044] sm:text-6xl">
            From account setup to <span className="bg-gradient-to-r from-[#364bc0] to-[#7466d5] bg-clip-text text-transparent">ready-to-use results.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600">
            PureListVerifier keeps the path to email list verification clear, with protected access and a focused workspace for your results.
          </p>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#5266cc]">Six clear steps</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-.04em] text-[#142448] sm:text-4xl">A simple route to cleaner list management.</h2>
          </div>
          <ol className="relative mx-auto mt-12 max-w-4xl space-y-5 before:absolute before:bottom-10 before:left-[29px] before:top-10 before:w-px before:bg-indigo-100 sm:before:left-1/2">
            {steps.map(([number, title, description, Icon], index) => (
              <li key={title} className={`relative grid gap-5 sm:grid-cols-2 sm:items-center ${index % 2 === 0 ? "" : "sm:[&>div:first-child]:order-2"}`}>
                <div className={`pl-16 sm:pl-0 ${index % 2 === 0 ? "sm:pr-16 sm:text-right" : "sm:order-2 sm:pl-16"}`}>
                  <p className="text-xs font-bold uppercase tracking-[.16em] text-[#5266cc]">Step {number}</p>
                  <h3 className="mt-2 text-xl font-extrabold tracking-[-.03em] text-[#1b2c50]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </div>
                <div className={`hidden sm:block ${index % 2 === 0 ? "sm:pl-16" : "sm:order-1 sm:pr-16"}`}>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(38,55,120,0.08)]">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#edf0ff] text-[#4356c9]"><Icon size={20} /></span>
                  </div>
                </div>
                <span className="absolute left-0 top-1 grid h-[58px] w-[58px] place-items-center rounded-2xl border border-indigo-100 bg-white text-xs font-extrabold text-[#5266cc] shadow-sm sm:left-1/2 sm:top-1 sm:-translate-x-1/2">{number}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-[#1e328e] to-[#5349ad] px-6 py-14 text-center text-white shadow-xl shadow-indigo-200 sm:px-12">
          <h2 className="text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Ready to begin?</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-indigo-100">Create an account or sign in to continue to your PureListVerifier access options.</p>
          <Link to="/access" className="shine-button mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-bold text-[#263b9e] shadow-sm transition hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#29398f]">Go to Access <ArrowRight size={16} /></Link>
        </div>
      </section>
    </main>
  );
}
