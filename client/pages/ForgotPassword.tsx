import { FormEvent, useState } from "react";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Brand } from "@/components/SiteHeader";

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsSubmitting(false);

    if (error) {
      console.error("Unable to request password reset", error);
      setErrorMessage("Unable to send a reset link. Please try again.");
      return;
    }

    setSubmitted(true);
  };

  return (
    <main className="flex min-h-screen bg-[#f7f9fc]">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-[#263bd0] via-[#293fd7] to-[#182a9f] p-10 text-white lg:flex">
        <Link to="/" className="inline-flex w-fit">
          <Brand />
        </Link>
        <div>
          <p className="max-w-md text-4xl font-extrabold leading-tight tracking-[-0.05em]">
            Secure access.
            <br />
            <span className="text-[#5de1d3]">Simple recovery.</span>
          </p>
          <p className="mt-5 max-w-sm text-sm leading-6 text-blue-100">
            Request a secure link to set a new password for your verification
            workspace.
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
            Forgot your password?
          </h1>
          {submitted ? (
            <div
              className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm leading-6 text-[#3155e8]"
              role="status"
              aria-live="polite"
            >
              If an account is associated with that email, we&apos;ve sent a
              secure password reset link. Check your inbox and spam folder.
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm leading-6 text-[#71809d]">
                Enter your account email and we&apos;ll send a secure link to
                create a new password.
              </p>
              <form onSubmit={submit} className="mt-8 space-y-5">
                <label className="block text-xs font-bold text-[#42516d]">
                  Email address
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-[#3155e8] focus:ring-4 focus:ring-[#3155e8]/10"
                  />
                </label>
                {errorMessage && (
                  <p
                    role="alert"
                    className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                  >
                    {errorMessage}
                  </p>
                )}
                <button
                  disabled={isSubmitting}
                  className="shine-button w-full rounded-full bg-[#3155e8] py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-[#2547d5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Mail className="mr-2 inline" size={16} />{" "}
                  {isSubmitting ? "Sending link…" : "Send reset link"}
                </button>
              </form>
            </>
          )}
          {submitted && (
            <Link
              to="/login"
              className="mt-6 inline-flex text-sm font-bold text-[#3155e8] hover:underline"
            >
              Return to login
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
