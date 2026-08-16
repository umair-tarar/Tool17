import { Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export function Brand({ light = true }: { light?: boolean }) {
  return (
    <span className={`flex items-center gap-2.5 text-sm font-extrabold tracking-tight ${light ? "text-white" : "text-[#0f1d42]"}`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#4058d9] to-[#7668dc] text-white shadow-md shadow-indigo-200/70">
        <ShieldCheck size={19} strokeWidth={2.4} />
      </span>
      <span className="flex min-w-0 leading-none text-[15px]"><span>PureList</span><span className={light ? "text-[#aebcff]" : "text-[#5869d8]"}>Verifier</span></span>
    </span>
  );
}

export default function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handlePublicNavigation = () => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed inset-x-4 top-4 z-50 rounded-full border border-white/70 bg-white/75 shadow-lg shadow-indigo-100/60 backdrop-blur-md sm:inset-x-6 lg:inset-x-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" onClick={handlePublicNavigation} className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5164d8] focus-visible:ring-offset-4"><Brand light={false} /></Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex" aria-label="Main navigation">
          <Link to="/" onClick={handlePublicNavigation} className="shine-button rounded-full px-2 py-2 transition hover:text-[#273baf] focus:outline-none focus-visible:text-[#273baf]">Home</Link>
          <Link to="/features" onClick={handlePublicNavigation} className="shine-button rounded-full px-2 py-2 transition hover:text-[#273baf] focus:outline-none focus-visible:text-[#273baf]">Features</Link>
          <Link to="/pricing" onClick={handlePublicNavigation} className="shine-button rounded-full px-2 py-2 transition hover:text-[#273baf] focus:outline-none focus-visible:text-[#273baf]">Pricing</Link>
          <Link to="/how-it-works" onClick={handlePublicNavigation} className="shine-button rounded-full px-2 py-2 transition hover:text-[#273baf] focus:outline-none focus-visible:text-[#273baf]">How It Works</Link>
          <Link to="/testimonials" onClick={handlePublicNavigation} className="shine-button rounded-full px-2 py-2 transition hover:text-[#273baf] focus:outline-none focus-visible:text-[#273baf]">Testimonials</Link>
          <Link to="/faq" onClick={handlePublicNavigation} className="shine-button rounded-full px-2 py-2 transition hover:text-[#273baf] focus:outline-none focus-visible:text-[#273baf]">FAQ</Link>
          <Link to="/about" onClick={handlePublicNavigation} className="shine-button rounded-full px-2 py-2 transition hover:text-[#273baf] focus:outline-none focus-visible:text-[#273baf]">About</Link>
          <Link to="/contact" onClick={handlePublicNavigation} className="shine-button rounded-full px-2 py-2 transition hover:text-[#273baf] focus:outline-none focus-visible:text-[#273baf]">Contact</Link>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="shine-button rounded-full px-3 py-2 text-sm font-semibold text-[#26375e] transition hover:text-[#273baf] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5164d8]">Login</Link>
          <Link to="/pricing" className="shine-button rounded-full bg-[#3349be] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#263aa5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5164d8] focus-visible:ring-offset-2">View Plans</Link>
        </div>
        <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-[#1e315b] shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5164d8] md:hidden" aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" onClick={() => setMobileMenuOpen((open) => !open)}>
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        {mobileMenuOpen && <nav id="mobile-navigation" className="absolute inset-x-5 top-full mt-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10 md:hidden" aria-label="Mobile navigation">
          <Link to="/" onClick={handlePublicNavigation} className="shine-button block rounded-full px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Home</Link>
          <Link to="/features" onClick={handlePublicNavigation} className="shine-button block rounded-full px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Features</Link>
          <Link to="/pricing" onClick={handlePublicNavigation} className="shine-button block rounded-full px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Pricing</Link>
          <Link to="/how-it-works" onClick={handlePublicNavigation} className="shine-button block rounded-full px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">How It Works</Link>
          <Link to="/testimonials" onClick={handlePublicNavigation} className="shine-button block rounded-full px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Testimonials</Link>
          <Link to="/faq" onClick={handlePublicNavigation} className="shine-button block rounded-full px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">FAQ</Link>
          <Link to="/about" onClick={handlePublicNavigation} className="shine-button block rounded-full px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">About</Link>
          <Link to="/contact" onClick={handlePublicNavigation} className="shine-button block rounded-full px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Contact</Link>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="shine-button rounded-full border border-slate-200 px-3 py-2.5 text-center text-sm font-bold text-slate-700">Login</Link>
            <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="shine-button rounded-full bg-[#3349be] px-3 py-2.5 text-center text-sm font-bold text-white">View Plans</Link>
          </div>
        </nav>}
      </div>
    </header>
  );
}
