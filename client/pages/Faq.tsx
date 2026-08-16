import { ArrowRight, ChevronDown, CircleHelp } from "lucide-react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";

const faqs = [
  ["What is PureListVerifier?", "PureListVerifier is an email verification workspace for checking email addresses, reviewing list results, and managing available verification credits."],
  ["How do I create an account?", "Select Get Started or Login in the site header, then choose User Access and create an account from the access page."],
  ["Why does my account need approval?", "PureListVerifier uses administrator-controlled approval to protect access to the verification workspace."],
  ["What happens while my account is pending?", "Your account cannot access the verification workspace until an administrator approves it. The application shows that your access is pending approval."],
  ["What can an approved user access?", "An approved user can sign in to the verification workspace to check individual email addresses, upload lists, review results, and view available credits."],
  ["How does list verification work?", "After you upload a supported list file in the workspace, PureListVerifier processes the email addresses and presents the available verification outcomes in the results area."],
  ["How do I upload a list?", "In the verification workspace, choose a file to upload. The current workspace accepts CSV, XLSX, and XLS files."],
  ["How do I view verification results?", "After a list is processed, the workspace displays the results and organizes the available outcomes for review."],
  ["Can I download verification results?", "Yes. When results are available, the workspace provides a CSV report download and a separated workbook download."],
  ["How do credits and limits work?", "The workspace shows your available credits. One credit is used for each email check, and list verification uses credits for the addresses being checked."],
  ["What happens when I reach my limit?", "When there are no remaining credits, the workspace does not begin another check or list verification."],
  ["I forgot my password. How can I reset it?", "Open the Login page and select Forgot password. Follow the reset instructions sent through the password recovery flow."],
  ["How can I contact support?", "Visit the Contact page to send a message to the PureListVerifier team, or use the support email shown there."],
] as const;

export default function Faq() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fcfcff] text-[#152446]">
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_86%_15%,rgba(174,190,255,.46),transparent_22%),linear-gradient(180deg,#f9faff_0%,#fdfdff_100%)]">
        <div className="absolute left-1/2 top-20 -z-10 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-100/40 blur-3xl" />
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-5 pb-20 pt-32 text-center sm:px-8 sm:pb-24 sm:pt-44">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-bold text-[#4053bc] shadow-sm"><CircleHelp size={14} /> Helpful answers</div>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-.05em] text-[#102044] sm:text-6xl">Frequently asked <span className="bg-gradient-to-r from-[#364bc0] to-[#7466d5] bg-clip-text text-transparent">questions.</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600">Find clear answers about access, verification, results, and working with your PureListVerifier workspace.</p>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#5266cc]">Workspace guidance</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-.04em] text-[#142448] sm:text-4xl">Everything you need to know before you begin.</h2></div>
          <div className="mt-12 space-y-3">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(38,55,120,0.05)] transition hover:border-indigo-200">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-left text-base font-extrabold text-[#20335a] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5164d8] sm:px-6"><span>{question}</span><ChevronDown size={20} className="shrink-0 text-[#5266cc] transition duration-200 group-open:rotate-180" /></summary>
                <div className="border-t border-slate-100 px-5 py-5 text-sm leading-7 text-slate-600 sm:px-6">{answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-[#1e328e] to-[#5349ad] px-6 py-14 text-center text-white shadow-xl shadow-indigo-200 sm:px-12">
          <h2 className="text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Ready to access your workspace?</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-indigo-100">Create an account or sign in to continue to PureListVerifier.</p>
          <Link to="/access" className="shine-button mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-bold text-[#263b9e] shadow-sm transition hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#29398f]">Go to Access <ArrowRight size={16} /></Link>
        </div>
      </section>
    </main>
  );
}
