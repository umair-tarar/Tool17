import { ArrowRight, MessageSquareHeart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";

export default function Testimonials() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fcfcff] text-[#152446]">
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_86%_15%,rgba(174,190,255,.46),transparent_22%),linear-gradient(180deg,#f9faff_0%,#fdfdff_100%)]">
        <div className="absolute left-1/2 top-20 -z-10 h-[440px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-100/40 blur-3xl" />
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-5 pb-20 pt-32 text-center sm:px-8 sm:pb-24 sm:pt-44">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-bold text-[#4053bc] shadow-sm">
            <MessageSquareHeart size={14} /> Community feedback
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-.05em] text-[#102044] sm:text-6xl">What Our <span className="bg-gradient-to-r from-[#364bc0] to-[#7466d5] bg-clip-text text-transparent">Users Say</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600">We look forward to sharing verified feedback from PureListVerifier users as the product grows.</p>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-indigo-100 bg-gradient-to-br from-[#f3f5ff] via-white to-[#faf9ff] px-6 py-14 text-center shadow-[0_20px_60px_rgba(62,75,159,0.08)] sm:px-12 sm:py-20">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#4058d9] to-[#7668dc] text-white shadow-lg shadow-indigo-200/70"><Sparkles size={28} /></div>
          <p className="mt-8 text-xs font-bold uppercase tracking-[.16em] text-[#5266cc]">Testimonials coming soon</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-extrabold tracking-[-.04em] text-[#142448] sm:text-4xl">The next story could be yours.</h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-600">This space is reserved for genuine feedback from people using PureListVerifier. We will publish testimonials here when verified user stories are available.</p>
          <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
            {["Genuine user feedback", "Verified user stories", "Thoughtful product growth"].map((item) => <div key={item} className="rounded-2xl border border-white bg-white/80 px-4 py-5 text-sm font-bold text-[#32456c] shadow-sm">{item}</div>)}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-[#1e328e] to-[#5349ad] px-6 py-14 text-center text-white shadow-xl shadow-indigo-200 sm:px-12">
          <h2 className="text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Explore PureListVerifier for yourself.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-indigo-100">Create an account or sign in to continue to your access options.</p>
          <Link to="/access" className="shine-button mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-bold text-[#263b9e] shadow-sm transition hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#29398f]">Get Started <ArrowRight size={16} /></Link>
        </div>
      </section>
    </main>
  );
}
