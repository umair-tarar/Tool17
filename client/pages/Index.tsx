import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  CircleHelp,
  Download,
  FileCheck2,
  FileSpreadsheet,
  Home,
  KeyRound,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { Brand } from "@/components/SiteHeader";
import { useAuth } from "@/lib/AuthProvider";
import { supabase } from "@/lib/supabase";

type CheckResult = { status: "valid" | "invalid" | "risky"; message: string };
type VerificationStatus = "verified" | "invalid" | "error" | "unknown";
type VerificationRow = { email: string; status: VerificationStatus };
type Subscription = {
  id: string;
  status: string;
  billing_period: string;
  expiry_date: string | null;
  credits_allocated: number;
  credits_used: number;
  credits_remaining: number;
  subscription_plans: { name: string } | null;
};

function inspectEmail(value: string): CheckResult | null {
  if (!value.trim()) return null;
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    return { status: "invalid", message: "This is not a valid email format." };
  const [local, domain] = email.split("@");
  const riskyNames = [
    "info",
    "admin",
    "support",
    "sales",
    "hello",
    "contact",
    "example",
  ];
  if (
    riskyNames.includes(local) ||
    domain === "example.com" ||
    domain === "domain.com"
  )
    return {
      status: "risky",
      message:
        "Valid format, but this address is likely a role or placeholder email.",
    };
  return {
    status: "valid",
    message: "This email looks valid and safe to send.",
  };
}

function classifyEmail(value: string): VerificationStatus {
  const email = value.trim().toLowerCase();
  if (!email) return "unknown";
  if (!email.includes("@")) return "error";
  const result = inspectEmail(email);
  if (!result) return "unknown";
  if (result.status === "invalid") return "invalid";
  if (result.status === "risky") return "error";
  if (["unknown", "test", "none", "null", "na"].includes(email.split("@")[0]))
    return "unknown";
  return "verified";
}

async function readSpreadsheet(file: File): Promise<string[]> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const cells = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
    header: 1,
    blankrows: false,
  });
  return cells
    .flat()
    .map((cell) => String(cell ?? "").trim())
    .filter(Boolean);
}

export default function Index() {
  const [email, setEmail] = useState("");
  const [checkedEmail, setCheckedEmail] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [rows, setRows] = useState<VerificationRow[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [credits, setCredits] = useState(0);
  const [showZeroCredits, setShowZeroCredits] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const result = useMemo(() => inspectEmail(checkedEmail), [checkedEmail]);

  const hasWorkspaceAccess = profile?.access_status === "approved";

  const loadSubscription = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("subscriptions")
      .select("id,status,billing_period,expiry_date,credits_allocated,credits_used,credits_remaining,subscription_plans(name)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("expiry_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextSubscription = data as Subscription | null;
    if (!nextSubscription || !nextSubscription.expiry_date || new Date(nextSubscription.expiry_date) <= new Date()) {
      setSubscription(null);
      setCredits(0);
      return;
    }
    setSubscription(nextSubscription);
    setCredits(nextSubscription.credits_remaining);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
    void loadSubscription();
    const refreshTimer = window.setInterval(() => void loadSubscription(), 30000);
    const creditChannel = user
      ? supabase
          .channel(`subscription-balance-${user.id}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` }, () => void loadSubscription())
          .subscribe()
      : null;
    return () => {
      window.clearInterval(refreshTimer);
      if (creditChannel) void supabase.removeChannel(creditChannel);
    };
  }, [loading, user, navigate, loadSubscription]);

  const hasRemainingCredits = async () => {
    if (!user || !hasWorkspaceAccess || !subscription) return false;
    await loadSubscription();
    if (credits <= 0) {
      setShowZeroCredits(true);
      return false;
    }
    return true;
  };

  const refreshCreditsAfterFailedDeduction = async () => {
    await loadSubscription();
  };

  const checkEmail = async () => {
    if (!email.trim() || !(await hasRemainingCredits())) return;
    const { data, error } = await supabase.rpc("consume_subscription_credits", { amount: 1 });
    if (error || !data) {
      await refreshCreditsAfterFailedDeduction();
      return;
    }
    setCheckedEmail(email);
    setCredits(data.remaining);
  };

  const handleFile = (file?: File) => {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["csv", "xlsx", "xls"].includes(extension)) {
      setSelectedFile(null);
      setRows([]);
      setFileError("This file type is not supported. Please upload a CSV, XLSX, or XLS file.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setSelectedFile(null);
      setRows([]);
      setFileError("This file is too large. Please upload a file smaller than 100 MB.");
      return;
    }
    setFileError("");
    setSelectedFile(file);
    setRows([]);
  };

  const verifyFile = async () => {
    if (!selectedFile || !(await hasRemainingCredits())) return;
    setIsVerifying(true);
    const values = await readSpreadsheet(selectedFile);
    const nextRows = values.map((value) => ({
      email: value,
      status: classifyEmail(value),
    }));
    const { data, error } = await supabase.rpc("consume_subscription_credits", { amount: nextRows.length });
    if (!error && data) {
      setRows(nextRows);
      setCredits(data.remaining);
    } else {
      await refreshCreditsAfterFailedDeduction();
    }
    setIsVerifying(false);
  };

  const downloadReport = () => {
    const csv = [
      "Email,Result",
      ...rows.map((row) => `"${row.email.replace(/"/g, '""')}",${row.status}`),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedFile?.name.replace(/\.[^.]+$/, "") || "email-verification"}-results.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadSeparatedWorkbook = () => {
    const workbook = XLSX.utils.book_new();
    const groups: Array<[VerificationStatus, string]> = [
      ["verified", "Verified"],
      ["invalid", "Unvalid"],
      ["error", "Errors"],
      ["unknown", "Unknown"],
    ];
    groups.forEach(([status, sheetName]) => {
      const sheetRows = rows
        .filter((row) => row.status === status)
        .map((row) => ({ Email: row.email, Result: sheetName }));
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          sheetRows.length
            ? sheetRows
            : [{ Email: "No emails in this category", Result: sheetName }],
        ),
        sheetName,
      );
    });
    XLSX.writeFile(
      workbook,
      `${selectedFile?.name.replace(/\.[^.]+$/, "") || "email-verification"}-separated-results.xlsx`,
    );
  };

  const counts = rows.reduce<Record<VerificationStatus, number>>(
    (total, row) => ({ ...total, [row.status]: total[row.status] + 1 }),
    { verified: 0, invalid: 0, error: 0, unknown: 0 },
  );
  const hasResults = rows.length > 0;

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-[#f7f9fc] text-sm text-[#71809d]">Checking access...</main>;
  }

  if (!user) {
    return null;
  }

  if (!profile || !hasWorkspaceAccess) {
    const accessMessage = profile?.access_status === "rejected"
      ? "Your account access request was rejected."
      : profile?.access_status === "revoked"
        ? "Your account access has been revoked. Please contact the administrator."
        : "Your account is waiting for admin approval.";
    return <main className="grid min-h-screen place-items-center bg-[#f7f9fc] px-5 text-center text-[#17223b]"><div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><ShieldCheck className="mx-auto mb-4 text-[#263bd0]" size={32} /><h1 className="text-xl font-extrabold">Workspace access unavailable</h1><p className="mt-3 text-sm text-[#71809d]">{accessMessage}</p></div></main>;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_92%_4%,#e7edff_0%,#f6f8fc_34%,#f6f8fc_100%)] text-[#17223b]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[266px] shrink-0 flex-col border-r border-indigo-200/30 bg-gradient-to-b from-[#344ac0] via-[#2b40b2] to-[#1e2d8f] text-white shadow-[12px_0_36px_rgba(35,57,153,0.12)] lg:flex">
          <div className="px-6 pb-5 pt-7">
            <Brand />
            <div className="mt-8 rounded-2xl border border-white/15 bg-white/[0.09] p-4 shadow-inner shadow-indigo-950/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-100">
                <LayoutDashboard size={14} /> Workspace
              </div>
              <p className="mt-3 text-sm font-bold leading-5 text-white">Email verification, kept focused.</p>
              <p className="mt-1.5 text-[11px] leading-5 text-indigo-100">Upload a list or check one address at a time from your secure workspace.</p>
            </div>
          </div>
          <nav className="px-4" aria-label="Workspace navigation">
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/15 px-4 py-3 text-xs font-bold shadow-sm">
              <ShieldCheck size={16} className="text-[#c9d2ff]" />
              Verification workspace
            </div>
          </nav>
          <div className="mt-auto border-t border-white/15 bg-[#16288d]/20 px-5 py-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-gradient-to-br from-[#ff9b82] to-[#ef6e70] text-xs font-bold shadow-sm">
                {profile?.email?.slice(0, 2).toUpperCase() ?? "PL"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold">{profile?.email ?? "Loading account..."}</p>
                <p className="text-[10px] text-blue-200">Verification workspace</p>
              </div>
              <ChevronDown size={14} className="ml-auto shrink-0 text-blue-200" />
            </div>
            <div className="rounded-xl border border-white/15 bg-white/[0.09] p-3">
              <div className="flex items-end justify-between text-[11px] font-bold">
                <span>{credits.toLocaleString()} <span className="font-normal text-blue-200">credits</span></span>
                <span className="text-[10px] font-medium text-indigo-100">Limit 200,000</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/25">
                <div className="h-full rounded-full bg-[#aebeff] transition-all" style={{ width: `${(credits / 200000) * 100}%` }} />
              </div>
            </div>
            {profile?.role === "admin" && <Link to="/admin" className="mt-3 block text-center text-[10px] font-semibold text-blue-100 underline underline-offset-2">Open admin dashboard</Link>}
          </div>
        </aside>
        <section className="flex-1 overflow-hidden">
          <header className="border-b border-white/70 bg-white/70 px-5 py-4 shadow-[0_4px_24px_rgba(49,73,190,0.06)] backdrop-blur-xl sm:px-8 lg:px-10">
            <div className="mx-auto flex max-w-[1450px] items-center justify-between gap-4">
              <div className="flex items-center gap-3 lg:hidden"><Brand light={false} /><span className="hidden rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-[#4058d9] sm:inline">Workspace</span></div>
              <div className="hidden lg:flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#e9edff] to-[#dfe5ff] text-[#4058d9]"><ShieldCheck size={18} /></span><div><p className="text-xs font-extrabold text-[#1d3060]">PureListVerifier</p><p className="text-[10px] font-medium text-[#71809d]">Secure verification workspace</p></div></div>
              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <span className="hidden text-xs font-medium text-[#71809d] xl:inline">Ready to verify your next list</span>
                <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/85 px-3 py-2 text-xs font-bold text-[#51617d] shadow-sm transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5164d8]" aria-label="Go back">
                  <ArrowLeft size={15} /> <span className="hidden sm:inline">Back</span>
                </button>
                <Link to="/" className="inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-bold text-[#4058d9] shadow-sm transition hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5164d8]" aria-label="Go to home">
                  <Home size={15} /> <span className="hidden sm:inline">Home</span>
                </Link>
                <button className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white/85 px-3 py-2 text-xs font-bold text-[#51617d] shadow-sm transition hover:bg-white xl:flex"><CircleHelp size={15} /> Help center</button>
              </div>
            </div>
          </header>
          <div className="mx-auto max-w-[1450px] p-5 sm:p-8 lg:p-10">
            <div className="mb-7 rounded-2xl border border-white/80 bg-white/65 p-5 shadow-[0_8px_28px_rgba(47,66,154,0.06)] backdrop-blur-sm sm:flex sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#71809d]"><Sparkles size={13} className="text-[#5869d8]" /> Workspace / Email verification</p>
                <h1 className="bg-gradient-to-r from-[#182a9f] via-[#3155e8] to-[#6d5df5] bg-clip-text text-[27px] font-extrabold tracking-[-0.04em] text-transparent">Verify with confidence</h1>
                <p className="mt-2 max-w-xl text-xs leading-5 text-[#71809d]">Choose a file for a complete list check, or use the quick check panel for a single address.</p>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-indigo-100 bg-[#f7f8ff] px-3.5 py-3 sm:mt-0"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-[#5266cc] shadow-sm"><FileSpreadsheet size={16} /></span><p className="text-[11px] leading-4 text-[#60708d]"><span className="block font-bold text-[#26375e]">Ready for your list</span>CSV, XLSX, or XLS up to 100 MB</p></div>
            </div>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
              <div>
                <div
                  className="rounded-xl border border-dashed border-[#b9c4d8] bg-gradient-to-br from-white via-white to-[#eef3ff] p-6 text-center shadow-[0_3px_14px_rgba(30,55,90,0.04)] sm:p-8"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleFile(event.dataTransfer.files[0]);
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={(event) => handleFile(event.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#e8edff] to-[#d9e3ff] text-[#3155e8] shadow-[0_8px_20px_rgba(49,85,232,0.12)] transition hover:from-[#dfe7ff] hover:to-[#cbd8ff]"
                  >
                    <UploadCloud size={25} />
                  </button>
                  <div className="mb-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6879d8]"><span className="h-px w-6 bg-indigo-200" /> Bulk verification <span className="h-px w-6 bg-indigo-200" /></div>
                  <h2 className="text-sm font-extrabold text-[#17223b]">
                    Upload your list to verify
                  </h2>
                  <p className="mt-1 text-xs text-[#71809d]">
                    Drag & drop a file, or{" "}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="font-bold text-[#3155e8] underline"
                    >
                      browse files
                    </button>
                  </p>
                  <p className="mx-auto mt-3 max-w-[500px] text-[10px] leading-5 text-[#8c98ad]">
                    We support CSV, XLSX and XLS files with one email per line
                    (max 100 MB). Learn more about{" "}
                    <span className="font-semibold text-[#3155e8]">
                      formatting rules
                    </span>{" "}
                    or{" "}
                    <span className="font-semibold text-[#3155e8]">
                      download example file
                    </span>
                    .
                  </p>
                  {fileError && (
                    <p role="alert" className="mx-auto mt-3 max-w-[500px] rounded-md bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                      {fileError}
                    </p>
                  )}
                  {selectedFile && (
                    <div className="mx-auto mt-4 flex max-w-sm items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                      <FileCheck2 size={15} /> {selectedFile.name} ready to
                      verify
                    </div>
                  )}
                </div>
                {selectedFile && (
                  <div className="mt-6 rounded-xl border border-[#dbe2f7] bg-white p-5 shadow-[0_3px_14px_rgba(30,55,90,0.04)] sm:p-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-sm font-extrabold text-[#243653]">
                          Your file is ready
                        </p>
                        <p className="mt-1 text-xs text-[#8b97aa]">
                          Click verify to scan every email and create your
                          results file.
                        </p>
                      </div>
                      <button
                        disabled={isVerifying}
                        onClick={verifyFile}
                        className="flex items-center justify-center gap-2 rounded-lg bg-[#3155e8] px-5 py-3 text-xs font-bold text-white shadow-[0_5px_12px_rgba(49,85,232,0.22)] transition hover:bg-[#2547d5] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isVerifying ? "Reading file..." : "Verify emails"}
                      </button>
                    </div>
                    {hasResults && (
                      <div className="mt-5 border-t border-slate-100 pt-5">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="rounded-lg bg-emerald-50 p-3">
                            <p className="text-[10px] font-bold uppercase text-emerald-600">
                              Verified
                            </p>
                            <p className="mt-1 text-xl font-extrabold text-emerald-700">
                              {counts.verified}
                            </p>
                          </div>
                          <div className="rounded-lg bg-rose-50 p-3">
                            <p className="text-[10px] font-bold uppercase text-rose-600">
                              Unvalid
                            </p>
                            <p className="mt-1 text-xl font-extrabold text-rose-700">
                              {counts.invalid}
                            </p>
                          </div>
                          <div className="rounded-lg bg-amber-50 p-3">
                            <p className="text-[10px] font-bold uppercase text-amber-600">
                              Errors
                            </p>
                            <p className="mt-1 text-xl font-extrabold text-amber-700">
                              {counts.error}
                            </p>
                          </div>
                          <div className="rounded-lg bg-slate-100 p-3">
                            <p className="text-[10px] font-bold uppercase text-slate-500">
                              Unknown
                            </p>
                            <p className="mt-1 text-xl font-extrabold text-slate-700">
                              {counts.unknown}
                            </p>
                          </div>
                        </div>
                        <div className="mt-5 grid gap-2 sm:grid-cols-2">
                          <button
                            onClick={downloadSeparatedWorkbook}
                            className="flex items-center justify-center gap-2 rounded-lg bg-[#3155e8] py-3 text-xs font-bold text-white transition hover:bg-[#2547d5]"
                          >
                            <Download size={15} /> Download separated Excel
                          </button>
                          <button
                            onClick={downloadReport}
                            className="flex items-center justify-center gap-2 rounded-lg border border-[#d9e0ff] bg-[#f4f6ff] py-3 text-xs font-bold text-[#3155e8] transition hover:bg-[#eaf0ff]"
                          >
                            <Download size={15} /> Download combined CSV
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <aside className="space-y-6">
                <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-[#f7f9ff] p-6 shadow-[0_3px_14px_rgba(30,55,90,0.04)]">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-sm font-extrabold">
                      Single Email Verification
                    </h2>
                    <button className="text-[#9aa6b8]">
                      <CircleHelp size={15} />
                    </button>
                  </div>
                  <div className="flex items-center rounded-lg border border-slate-200 px-3 focus-within:border-[#3155e8] focus-within:ring-2 focus-within:ring-[#3155e8]/10">
                    <Mail size={15} className="text-[#9ba6b8]" />
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void checkEmail();
                      }}
                      placeholder="Enter email to check"
                      className="w-full px-2.5 py-3 text-xs outline-none"
                    />
                    <button
                      onClick={() => {
                        setEmail("");
                        setCheckedEmail("");
                      }}
                      className={`text-[#9ba6b8] ${email ? "visible" : "invisible"}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <button
                    disabled={!email.trim()}
                    onClick={checkEmail}
                    className="mt-3 w-full rounded-lg bg-[#3155e8] py-2.5 text-xs font-bold text-white shadow-[0_5px_12px_rgba(49,85,232,0.22)] transition hover:bg-[#2547d5] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {credits === 0 ? "No credits remaining" : "Check email"}
                  </button>
                  {result ? (
                    <div
                      className={`mt-4 rounded-lg border p-3 ${result.status === "valid" ? "border-emerald-100 bg-emerald-50" : result.status === "risky" ? "border-amber-100 bg-amber-50" : "border-rose-100 bg-rose-50"}`}
                    >
                      <div className="flex items-center gap-2 text-xs font-extrabold">
                        {result.status === "valid" ? (
                          <Check size={15} className="text-emerald-600" />
                        ) : (
                          <AlertCircle
                            size={15}
                            className={
                              result.status === "risky"
                                ? "text-amber-600"
                                : "text-rose-600"
                            }
                          />
                        )}
                        {result.status === "valid"
                          ? "Valid email"
                          : result.status === "risky"
                            ? "Risky email"
                            : "Invalid email"}
                      </div>
                      <p className="mt-1 text-[11px] leading-4 text-[#65738a]">
                        {result.message}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 flex h-28 flex-col items-center justify-center rounded-lg bg-[#fbfcfe] text-center text-[11px] text-[#98a4b5]">
                      <div className="mb-2 flex gap-2 text-[#9aa9e9]">
                        <Mail size={20} />
                        <ShieldCheck size={20} />
                      </div>
                      Results will appear here, start now.
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-[#f7f9ff] p-6 shadow-[0_3px_14px_rgba(30,55,90,0.04)]">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-extrabold">Credits</h2>
                    <KeyRound size={16} className="text-[#3155e8]" />
                  </div>
                  <p className="text-[11px] text-[#8d99ab]">
                    Total Available Credits
                  </p>
                  <div className="mt-2 flex items-end justify-between">
                    <span className="text-3xl font-extrabold tracking-tight text-[#243653]">
                      {credits.toLocaleString()}
                    </span>
                    <span className="pb-1 text-xs text-[#8d99ab]">
                      {baseCredits.toLocaleString()} included
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] font-semibold text-[#5266cc]">
                    Extra Credits Purchased: {extraCredits.toLocaleString()}
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-[#edf0f6]">
                    <div
                      className="h-full rounded-full bg-[#3155e8] transition-all"
                      style={{ width: `${Math.min(100, (credits / (baseCredits + extraCredits || 1)) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-3 text-[10px] text-[#8d99ab]">
                    1 credit is used for every email check
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_3px_14px_rgba(30,55,90,0.04)]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold">Payment status</h2>
                    <Link to="/features" className="text-[11px] font-bold text-[#3155e8]">Buy credits</Link>
                  </div>
                  <div className="mt-4 space-y-3">
                    {purchases.length === 0 ? <p className="text-[11px] leading-5 text-[#8d99ab]">No credit purchases yet.</p> : purchases.map((purchase) => <div key={purchase.id} className="rounded-lg bg-[#f7f9ff] p-3 text-[11px]"><div className="flex items-start justify-between gap-3"><p className="font-bold text-[#243653]">{purchase.credit_amount.toLocaleString()} credits</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${purchase.status === "fulfilled" ? "bg-emerald-50 text-emerald-700" : purchase.status === "rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{purchase.status === "submitted_for_review" ? "Pending verification" : purchase.status}</span></div><p className="mt-1 text-[#71809d]">{purchase.amount} {purchase.currency} · {purchase.package_id}</p>{purchase.rejection_reason && <p className="mt-1 text-rose-600">{purchase.rejection_reason}</p>}</div>)}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
      {showZeroCredits && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-5" role="dialog" aria-modal="true" aria-labelledby="zero-credits-title">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-amber-50 text-amber-600">
              <AlertCircle size={22} />
            </div>
            <h2 id="zero-credits-title" className="mt-4 text-lg font-extrabold text-[#17223b]">0 Credits Remaining</h2>
            <p className="mt-2 text-sm leading-6 text-[#65738a]">You have used all your available credits. Please contact support to continue.</p>
            <button type="button" onClick={() => setShowZeroCredits(false)} className="mt-5 rounded-lg bg-[#3155e8] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#2547d5]">Close</button>
          </div>
        </div>
      )}
    </main>
  );
}
