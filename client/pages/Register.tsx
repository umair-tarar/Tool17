import { ArrowLeft, Check, Eye, EyeOff, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Brand } from "@/components/SiteHeader";

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasDuplicateEmail, setHasDuplicateEmail] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setHasDuplicateEmail(false);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const name = String(formData.get("name") ?? "");
    const password = String(formData.get("password") ?? "");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/email-confirmed`,
      },
    });
    const isDuplicateEmail =
      (!error && data.user && data.user.identities?.length === 0) ||
      error?.message.toLowerCase().includes("already registered");
    if (isDuplicateEmail) {
      setHasDuplicateEmail(true);
      return;
    }
    if (error || !data.user) {
      setErrorMessage(error?.message ?? "Unable to create your account.");
      return;
    }
    await supabase.from("login_activity").insert({ user_id: data.user.id, email, action: "registration" });
    if (data.session) await supabase.auth.signOut();
    setErrorMessage("Check your email to confirm your account before logging in.");
  };
  return (
    <main className="flex min-h-screen bg-[#f7f9fc]">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-[#263bd0] via-[#293fd7] to-[#182a9f] p-10 text-white lg:flex">
        <Link to="/" className="inline-flex w-fit">
          <Brand />
        </Link>
        <div>
          <p className="max-w-md text-4xl font-extrabold leading-tight tracking-[-0.05em]">
            Start with a<br />
            <span className="text-[#5de1d3]">cleaner list.</span>
          </p>
          <div className="mt-6 space-y-3 text-sm text-blue-100">
            <p className="flex items-center gap-2">
              <Check size={15} className="text-[#5de1d3]" /> Paid monthly
              subscription credits
            </p>
            <p className="flex items-center gap-2">
              <Check size={15} className="text-[#5de1d3]" /> Upload CSV, XLSX,
              or XLS files
            </p>
            <p className="flex items-center gap-2">
              <Check size={15} className="text-[#5de1d3]" /> Download separated
              results
            </p>
          </div>
        </div>
        <p className="text-xs text-blue-200">© 2024 PureListVerifier</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-2 text-xs font-bold text-[#71809d] hover:text-[#3155e8]"
          >
            <ArrowLeft size={14} /> Back to home
          </Link>
          <div className="mb-8 lg:hidden">
            <Link to="/" className="inline-flex">
              <Brand light={false} />
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-[#17223b]">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-[#71809d]">
            Register your account, confirm your email, and wait for administrator approval.
          </p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block text-xs font-bold text-[#42516d]">
              Full name
              <input
                required
                name="name"
                placeholder="Your name"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-[#3155e8] focus:ring-4 focus:ring-[#3155e8]/10"
              />
            </label>
            <label className="block text-xs font-bold text-[#42516d]">
              Work email
              <input
                required
                type="email"
                name="email"
                placeholder="you@company.com"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-[#3155e8] focus:ring-4 focus:ring-[#3155e8]/10"
              />
            </label>
            <label className="block text-xs font-bold text-[#42516d]">
              Create password
              <div className="mt-2 flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-[#3155e8] focus-within:ring-4 focus-within:ring-[#3155e8]/10">
                <input
                  required
                  minLength={6}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-3.5 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-4 text-[#8e9ab0]"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
            <label className="flex items-start gap-2 pt-1 text-xs leading-5 text-[#71809d]">
              <input
                required
                type="checkbox"
                className="mt-1 accent-[#3155e8]"
              />{" "}
              I agree to the Terms of Service and Privacy Policy.
            </label>
            {hasDuplicateEmail ? (
              <div role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                <p className="font-bold">Account Already Exists</p>
                <p className="mt-1 font-semibold">An account with this email already exists. Please log in instead.</p>
              </div>
            ) : errorMessage ? (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{errorMessage}</p>
            ) : null}
            <button className="shine-button w-full rounded-full bg-[#ff8250] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-[#f87343] hover:shadow-xl">
              <UserPlus className="mr-2 inline" size={16} /> Register now
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-[#71809d]">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-[#3155e8]">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
