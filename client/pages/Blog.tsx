import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";

export default function Blog() {
  return <main className="min-h-screen bg-[#f5f8f9] text-[#17223b]">
    <section className="bg-gradient-to-br from-[#263bd0] via-[#293fd7] to-[#182a9f] text-white">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-32 text-center sm:px-8 sm:pt-40"><h1 className="mx-auto max-w-4xl text-[38px] font-extrabold leading-[1.05] tracking-[-0.06em] sm:text-[62px]">Blog & Resources</h1><p className="mx-auto mt-6 max-w-2xl text-base leading-6 text-blue-100">Read our latest articles about email verification, marketing tips, and industry insights.</p></div>
    </section>
    
    <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20"><h2 className="text-3xl font-extrabold tracking-[-0.04em]">Latest Articles</h2><p className="mt-4 text-sm text-[#71809d]">Blog articles will be displayed here. You can manage blog content through WordPress and embed it here.</p><div className="mt-12 grid gap-8 md:grid-cols-2"><article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-lg font-extrabold text-[#243653]">Coming Soon</h3><p className="mt-2 text-sm text-[#71809d]">Blog articles coming soon. Configure your WordPress blog to display content here.</p></article></div></section>
  </main>;
}
