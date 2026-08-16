import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleX, LogIn, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthProvider";

function getConfirmationError(search: string, hash: string) {
  const params = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const error = params.get("error") ?? hashParams.get("error");

  if (!error) return null;

  return (
    params.get("error_description") ??
    hashParams.get("error_description") ??
    "This confirmation link is invalid or has expired. Please request a new one."
  );
}

export default function EmailConfirmed() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, session } = useAuth();
  const [secondsRemaining, setSecondsRemaining] = useState(3);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const callbackError = useMemo(
    () => getConfirmationError(location.search, location.hash),
    [location.hash, location.search],
  );
  const errorMessage = callbackError ?? verificationError;

  useEffect(() => {
    if (callbackError || loading) return;

  }, [callbackError, loading, session]);

  useEffect(() => {
    if (errorMessage || loading) return;

    toast({ title: "Account created successfully!", duration: 3000 });
    const countdown = window.setInterval(() => {
      setSecondsRemaining((seconds) => Math.max(seconds - 1, 0));
    }, 1000);
    const timeout = window.setTimeout(() => {
      navigate("/login", { replace: true });
    }, 3000);

    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(timeout);
    };
  }, [errorMessage, loading, navigate, session]);

  const isSuccess = !loading && !errorMessage;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f8ff] p-4 sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(93,225,211,0.28),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(49,85,232,0.18),_transparent_38%)]" />
      <section role="dialog" aria-modal="true" aria-labelledby="confirmation-title" className="relative w-full max-w-sm rounded-3xl border border-white/70 bg-white/95 p-6 text-center shadow-[0_24px_70px_rgba(27,45,112,0.18)] backdrop-blur sm:p-8">
        <Link to="/" className="mx-auto flex w-fit items-center gap-2 text-sm font-extrabold text-[#243653]">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#5de1d3] to-[#3a9fe8] text-[#182a9f] shadow-lg shadow-blue-200">
            <ShieldCheck size={18} strokeWidth={2.5} />
          </span>
          <span>PureList</span><span className="text-[#5de1d3]">Verifier</span>
        </Link>

        <div className={`mx-auto mt-7 grid h-16 w-16 place-items-center rounded-full ring-8 ${isSuccess ? "bg-emerald-500 text-white ring-emerald-50" : "bg-rose-500 text-white ring-rose-50"}`}>
          {isSuccess ? <CheckCircle2 size={36} strokeWidth={2.3} /> : <CircleX size={36} strokeWidth={2.3} />}
        </div>

        <h1 id="confirmation-title" className="mt-5 text-2xl font-extrabold tracking-[-0.04em] text-[#17223b]">
          {isSuccess ? "Congratulations!" : "We couldn’t confirm your email"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#657493]">
          {isSuccess
            ? "Your account has been registered successfully."
            : errorMessage}
        </p>

        {isSuccess ? (
          <>
            <div className="mt-7 h-1.5 overflow-hidden rounded-full bg-blue-50" aria-hidden="true">
              <div className="h-full animate-[confirmation-progress_3s_linear_forwards] rounded-full bg-gradient-to-r from-[#5de1d3] to-[#3155e8]" />
            </div>
            <p className="mt-3 text-xs font-semibold text-[#71809d]" aria-live="polite">Opening login in {secondsRemaining} second{secondsRemaining === 1 ? "" : "s"}…</p>
            <Link to="/login" replace className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#263bd0] to-[#3155e8] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-blue-200">
              <LogIn size={17} /> Go to login now
            </Link>
          </>
        ) : (
          <Link to="/register" className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#263bd0] to-[#3155e8] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:brightness-110">
            Register again
          </Link>
        )}
      </section>
    </main>
  );
}
