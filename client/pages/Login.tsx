import { ArrowLeft, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthProvider";
import { Brand } from "@/components/SiteHeader";
import { toast } from "@/hooks/use-toast";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdminLogin = searchParams.get("mode") === "admin";
  const resetComplete = searchParams.get("reset") === "success";
  const { profile } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingRedirect, setPendingRedirect] = useState(false);

  useEffect(() => {
    if (!pendingRedirect || !profile) return;
    navigate(profile.role === "admin" ? "/admin" : "/dashboard");
  }, [navigate, pendingRedirect, profile]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setErrorMessage(error?.message ?? "Unable to log in.");
      return;
    }
    await supabase.from("login_activity").insert({ user_id: data.user.id, email, action: "login" });
    toast({ title: "Account logged in successfully!", duration: 5000 });
    setPendingRedirect(true);
  };
  return (
    <main className="flex min-h-screen bg-[#f7f9fc]">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-[#263bd0] via-[#293fd7] to-[#182a9f] p-10 text-white lg:flex">
        <Link to="/" className="inline-flex w-fit">
          <Brand />
        </Link>
        <div>
          <p className="max-w-md text-4xl font-extrabold leading-tight tracking-[-0.05em]">
            Reach the inbox.
            <br />
            <span className="text-[#5de1d3]">Skip the bounce.</span>
          </p>
          <p className="mt-5 max-w-sm text-sm leading-6 text-blue-100">
            Verify your lists, protect your reputation, and turn every send into
            a better result.
          </p>
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
            {isAdminLogin ? "Admin login" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-[#71809d]">
            {isAdminLogin ? "Log in with an administrator account to continue to the admin dashboard." : "Log in to continue to your verification workspace."}
          </p>
          {resetComplete && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700" role="status">Your password was updated. Log in with your new password.</p>}
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block text-xs font-bold text-[#42516d]">
              Email address
              <input
                required
                type="email"
                name="email"
                placeholder="you@company.com"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-[#3155e8] focus:ring-4 focus:ring-[#3155e8]/10"
              />
            </label>
            <label className="block text-xs font-bold text-[#42516d]">
              Password
              <div className="mt-2 flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-[#3155e8] focus-within:ring-4 focus-within:ring-[#3155e8]/10">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
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
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-[#71809d]">
                <input type="checkbox" className="accent-[#3155e8]" /> Remember
                me
              </label>
              <Link to="/forgot-password" className="font-bold text-[#3155e8]">
                Forgot password?
              </Link>
            </div>
            {errorMessage && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{errorMessage}</p>}
            <button className="shine-button w-full rounded-full bg-[#3155e8] py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-[#2547d5] hover:shadow-xl">
              <LockKeyhole className="mr-2 inline" size={16} /> Log in
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-[#71809d]">
            {isAdminLogin ? "Need user access?" : "Don’t have an account?"}{" "}
            <Link to={isAdminLogin ? "/access" : "/register"} className="font-bold text-[#3155e8]">
              {isAdminLogin ? "Choose access" : "Register now"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
