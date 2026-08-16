import { FormEvent, useState } from "react";
import { Mail, MessageSquare, Send } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";

export default function Contact() {
  const [isSent, setIsSent] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setSubmitError("");
    setIsSent(false);
    const formData = new FormData(form);
    const requestSubmissionId = submissionId ?? crypto.randomUUID();
    setSubmissionId(requestSubmissionId);
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim(),
        message: String(formData.get("message") ?? "").trim(),
        submissionId: requestSubmissionId,
      }),
    });

    if (!response.ok) {
      setSubmitError("Your message could not be sent. Please try again.");
      return;
    }

    setIsSent(true);
    setSubmissionId(null);
    form.reset();
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#fcfcff] text-[#152446]">
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_86%_15%,rgba(174,190,255,.46),transparent_22%),linear-gradient(180deg,#f9faff_0%,#fdfdff_100%)]">
        <div className="absolute left-1/2 top-20 -z-10 h-[360px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-100/40 blur-3xl" />
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-5 pb-20 pt-32 text-center sm:px-8 sm:pt-44 sm:pb-24">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-bold text-[#4053bc] shadow-sm">
            <MessageSquare size={14} /> We&apos;re here to help
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-.05em] text-[#102044] sm:text-6xl">Let&apos;s talk about your <span className="bg-gradient-to-r from-[#364bc0] to-[#7466d5] bg-clip-text text-transparent">verification workflow.</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600">Have a question about PureListVerifier? Send us a message and our team will get back to you.</p>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#5266cc]">Contact us</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-.04em] text-[#142448] sm:text-4xl">How can we help?</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-600">Use the form to ask about verification, workspace access, or anything else you need help with.</p>
            <div className="mt-8 flex items-start gap-4 rounded-2xl border border-indigo-100 bg-[#f3f5ff] p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-[#4356c9] shadow-sm"><Mail size={20} /></span>
              <div><h3 className="font-extrabold text-[#24365e]">Email support</h3><p className="mt-1 text-sm leading-6 text-slate-600">support@purelistverifier.com</p></div>
            </div>
          </div>

          <form className="rounded-2xl border border-slate-200 bg-[#fcfcff] p-5 shadow-[0_18px_50px_rgba(38,55,120,0.08)] sm:p-7" onSubmit={handleSubmit} noValidate>
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-[#24365e]" htmlFor="contact-name">Name</label>
                <input id="contact-name" name="name" type="text" required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152446] outline-none transition placeholder:text-slate-400 focus:border-[#5266cc] focus:ring-2 focus:ring-[#5266cc]/15" placeholder="Your name" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-[#24365e]" htmlFor="contact-email">Email</label>
                <input id="contact-email" name="email" type="email" required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152446] outline-none transition placeholder:text-slate-400 focus:border-[#5266cc] focus:ring-2 focus:ring-[#5266cc]/15" placeholder="you@company.com" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-[#24365e]" htmlFor="contact-message">Message</label>
                <textarea id="contact-message" name="message" rows={6} required className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152446] outline-none transition placeholder:text-slate-400 focus:border-[#5266cc] focus:ring-2 focus:ring-[#5266cc]/15" placeholder="How can we help?" />
              </div>
              <button type="submit" className="shine-button inline-flex items-center justify-center gap-2 rounded-full bg-[#3349be] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-[#263aa5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5164d8] focus-visible:ring-offset-2"><span className="relative z-10">{isSent ? "Message Sent" : "Send Message"}</span><Send size={16} className="relative z-10" /></button>
              {isSent && <p className="text-sm font-semibold text-emerald-700" role="status" aria-live="polite">Thanks! Your message has been sent successfully.</p>}
              {submitError && <p className="text-sm font-semibold text-red-600" role="alert">{submitError}</p>}
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
