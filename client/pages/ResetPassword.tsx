import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Brand } from "@/components/SiteHeader";
import { useAuth } from "@/lib/AuthProvider";
import { supabase } from "@/lib/supabase";

function getResetError() {
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hash);

  return params.get("error") || hashParams.get("error")
    ? "This password reset link is invalid or has expired. Please request a new one."
    : null;
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const { isPasswordRecovery, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    getResetError(),
  );
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);

  useEffect(() => {
    if (isPasswordRecovery) {
      setIsReady(true);
      setErrorMessage(null);
    }
  }, [isPasswordRecovery]);

  useEffect(() => {
    if (!loading && !isPasswordRecovery && !getResetError()) {
      setErrorMessage(
        "This password reset link is invalid or has expired. Please request a new one.",
      );
    }
  }, [isPasswordRecovery, loading]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage("Your new password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmation) {
      setErrorMessage("The password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.error("Unable to update recovery password", error);
      setErrorMessage(
        "Unable to update your password. Please request a new reset link.",
      );
      setIsSubmitting(false);
      return;
    }

    setIsSuccessful(true);
    window.setTimeout(() => {
      void supabase.auth.signOut().finally(() => {
        navigate("/login?reset=success", { replace: true });
      });
    }, 1200);
  };

  return (
    <main className="flex min-h-screen bg-[#f7f9fc]">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-[#263bd0] via-[#293fd7] to-[#182a9f] p-10 text-white lg:flex">
        <Link to="/" className="inline-flex w-fit">
          <Brand />
        </Link>
        <div>
          <p className="max-w-md text-4xl font-extrabold leading-tight tracking-[-0.05em]">
            Choose a new password.
            <br />
            <span className="text-[#5de1d3]">Keep your access secure.</span>
          </p>
          <p className="mt-5 max-w-sm text-sm leading-6 text-blue-100">
            Set a new password to return to your verification workspace.
          </p>
        </div>
        <p className="text-xs text-blue-200">© 2024 PureListVerifier</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Link
            to="/login"
            className="mb-10 inline-flex items-center gap-2 text-xs font-bold text-[#71809d] hover:text-[#3155e8]"
          >
            <ArrowLeft size={14} /> Back to login
          </Link>
          <div className="mb-8 lg:hidden">
            <Link to="/" className="inline-flex">
              <Brand light={false} />
            </Link>
          </div>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#edf0ff] text-[#4356c9]">
            <ShieldCheck size={23} />
          </span>
          <h1 className="mt-6 text-3xl font-extrabold tracking-[-0.04em] text-[#17223b]">
            Reset your password
          </h1>
          {errorMessage ? (
            <div
              className="mt-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700"
              role="alert"
            >
              {errorMessage}
            </div>
          ) : isSuccessful ? (
            <p
              className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-700"
              role="status"
            >
              Your password has been updated successfully.
            </p>
          ) : !isReady ? (
            <p className="mt-5 text-sm text-[#71809d]">
              Validating your secure reset link…
            </p>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-5">
              <label className="block text-xs font-bold text-[#42516d]">
                New password
                <div className="mt-2 flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-[#3155e8] focus-within:ring-4 focus-within:ring-[#3155e8]/10">
                  <input
                    required
                    minLength={8}
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-4 py-3.5 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="px-4 text-[#8e9ab0]"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
              <label className="block text-xs font-bold text-[#42516d]">
                Confirm new password
                <div className="mt-2 flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-[#3155e8] focus-within:ring-4 focus-within:ring-[#3155e8]/10">
                  <input
                    required
                    minLength={8}
                    type={showConfirmation ? "text" : "password"}
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    placeholder="Repeat your new password"
                    className="w-full px-4 py-3.5 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmation((visible) => !visible)}
                    className="px-4 text-[#8e9ab0]"
                    aria-label={
                      showConfirmation ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmation ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </label>
              <button
                disabled={isSubmitting}
                className="shine-button w-full rounded-full bg-[#3155e8] py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-[#2547d5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LockKeyhole className="mr-2 inline" size={16} />
                {isSubmitting ? "Updating password…" : "Update password"}
              </button>
            </form>
          )}
          {errorMessage && (
            <Link
              to="/forgot-password"
              className="mt-6 inline-flex text-sm font-bold text-[#3155e8] hover:underline"
            >
              Request a new reset link
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
