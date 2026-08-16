import {
  ArrowRight,
  Banknote,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  X,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileUp,
  Filter,
  KeyRound,
  LayoutDashboard,
  MailCheck,
  ShieldCheck,
  Smartphone,
  UploadCloud,
  UserRoundCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import { useAuth } from "@/lib/AuthProvider";
import { supabase, supabaseProjectUrl } from "@/lib/supabase";
import type { PaymentProviderId } from "@shared/payments";

const overviewFeatures = [
  [
    MailCheck,
    "Email list verification",
    "Check individual addresses or review a full list with clear, local result classifications.",
  ],
  [
    UploadCloud,
    "Bulk list upload",
    "Bring a list into the workspace and prepare its values for verification in one focused flow.",
  ],
  [
    FileSpreadsheet,
    "CSV, XLSX, and XLS",
    "Upload supported spreadsheet formats up to 100 MB. The first worksheet is read for non-empty values.",
  ],
  [
    CheckCircle2,
    "Clear result categories",
    "Review verified, invalid, error, and unknown outcomes alongside the addresses that produced them.",
  ],
  [
    Download,
    "Result downloads",
    "Export a combined CSV or an Excel workbook separated into result-category sheets.",
  ],
  [
    CreditCard,
    "Credit-based usage",
    "Use one credit for a single check and consume credits for the addresses processed in a bulk verification.",
  ],
  [
    BarChart3,
    "Usage visibility",
    "See your remaining credits and the workspace limit while you work through a list.",
  ],
  [
    ShieldCheck,
    "Approved access",
    "Accounts move through pending, approved, rejected, or revoked states before workspace access is available.",
  ],
  [
    LayoutDashboard,
    "Secure workspace",
    "Sign in to a protected verification workspace tied to your authenticated account.",
  ],
  [
    UsersRound,
    "Admin-controlled access",
    "Administrators can approve, reject, or revoke access and review account details.",
  ],
  [
    KeyRound,
    "Account access",
    "Create an account, confirm your email, sign in, and recover access through the existing password reset flow.",
  ],
  [
    Filter,
    "Activity visibility",
    "Administrators can review registration, login, credit reset, and latest account activity.",
  ],
] as const;

const details = [
  {
    eyebrow: "01 / Verify",
    title: "Verify with a focused workflow.",
    copy: "Check one address at a time or work through a prepared list in the verification workspace. The current product evaluates email format and flags role or placeholder-style addresses, then presents the outcome in a readable workspace view.",
    points: [
      "Single-email checks",
      "Verified, invalid, error, and unknown outcomes",
      "Clear status and message feedback",
    ],
    Icon: MailCheck,
    visual: "verify",
  },
  {
    eyebrow: "02 / Upload",
    title: "Bring your list in the format you already use.",
    copy: "Upload CSV, XLSX, or XLS files up to 100 MB. PureListVerifier reads the first worksheet and prepares non-empty cell values for checking, keeping the upload flow direct and easy to understand.",
    points: [
      "CSV, XLSX, and XLS support",
      "Up to 100 MB per file",
      "First-sheet, non-empty value parsing",
    ],
    Icon: FileUp,
    visual: "upload",
  },
  {
    eyebrow: "03 / Results",
    title: "Turn verification into usable files.",
    copy: "Review result counts in the workspace, then download the output in the format that fits the next step. Use a combined CSV for a compact report or a separated Excel workbook for category-by-category review.",
    points: [
      "Verified, invalid, error, and unknown counts",
      "Combined CSV report",
      "Separated Excel workbook",
    ],
    Icon: Download,
    visual: "results",
  },
  {
    eyebrow: "04 / Usage",
    title: "Keep usage visible as you work.",
    copy: "Credits are part of the verification workflow, not a hidden counter. The workspace shows remaining usage, consumes credits for checks, and prevents another verification when the available balance reaches zero.",
    points: [
      "Remaining balance in the workspace",
      "One credit for a single-email check",
      "Bulk usage based on addresses checked",
    ],
    Icon: CreditCard,
    visual: "credits",
  },
  {
    eyebrow: "05 / Access",
    title: "A workspace with controlled access.",
    copy: "New accounts begin in a pending state and require administrator approval before they can use the verification workspace. Approved users sign in to an authenticated area, while rejected or revoked access remains blocked.",
    points: [
      "Email confirmation and sign-in",
      "Administrator approval required",
      "Pending, rejected, and revoked states",
    ],
    Icon: UserRoundCheck,
    visual: "access",
  },
] as const;

const pricing = [
  {
    packageId: "10k" as const,
    credits: "10,000 Extra Credits",
    price: "$15",
    description: "A focused starting package",
    points: [
      "Great for smaller verification needs",
      "One-time credit purchase",
      "Clear package pricing",
      "Added after admin verification",
    ],
  },
  {
    packageId: "30k" as const,
    credits: "30,000 Extra Credits",
    price: "$45",
    description: "For steady verification projects",
    points: [
      "Ideal for recurring list checks",
      "One-time credit purchase",
      "Clear package pricing",
      "Added after admin verification",
    ],
  },
  {
    packageId: "50k" as const,
    credits: "50,000 Extra Credits",
    price: "$80",
    description: "A balanced package for teams",
    points: [
      "Built for growing verification needs",
      "One-time credit purchase",
      "Clear package pricing",
      "Added after admin verification",
    ],
  },
  {
    packageId: "75k" as const,
    credits: "75,000 Extra Credits",
    price: "$120",
    description: "For larger list review cycles",
    points: [
      "Supports larger verification workflows",
      "One-time credit purchase",
      "Clear package pricing",
      "Added after admin verification",
    ],
  },
  {
    packageId: "100k" as const,
    credits: "100,000 Extra Credits",
    price: "$150",
    description: "For high-volume verification planning",
    points: [
      "Made for planned list reviews",
      "One-time credit purchase",
      "Clear package pricing",
      "Added after admin verification",
    ],
  },
] as const;

const paymentMethods = [
  {
    provider: "visa_card" as const,
    name: "Visa / Debit Bank Card",
    description: "Pay with your bank card",
    Icon: CreditCard,
    iconClass: "bg-[#eef2ff] text-[#304da8]",
  },
  {
    provider: "nayapay" as const,
    name: "NayaPay",
    description: "Pay using NayaPay",
    Icon: WalletCards,
    iconClass: "bg-[#e9fbf6] text-[#078b70]",
  },
  {
    provider: "easypaisa" as const,
    name: "Easypaisa",
    description: "Pay using Easypaisa",
    Icon: Banknote,
    iconClass: "bg-[#effbea] text-[#4a9d37]",
  },
  {
    provider: "jazzcash" as const,
    name: "JazzCash",
    description: "Pay using JazzCash",
    Icon: Smartphone,
    iconClass: "bg-[#fff0f2] text-[#c51d42]",
  },
] as const;

type DetailVisual = (typeof details)[number]["visual"];
type PricingPackage = (typeof pricing)[number];
type PaymentMethod = (typeof paymentMethods)[number];

function FeatureVisual({ type }: { type: DetailVisual }) {
  if (type === "verify")
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
          <span className="text-xs font-semibold text-slate-500">
            name@company.com
          </span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
            Verified
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
          <span className="text-xs font-semibold text-slate-500">
            info@example.com
          </span>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
            Review
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
          <span className="text-xs font-semibold text-slate-500">
            not-an-email
          </span>
          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700">
            Invalid
          </span>
        </div>
      </div>
    );
  if (type === "upload")
    return (
      <div className="rounded-2xl border border-dashed border-indigo-200 bg-white/80 p-5 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-[#4b5ed0]">
          <UploadCloud size={23} />
        </span>
        <p className="mt-4 text-sm font-bold text-[#1b2c50]">
          Drop your list here
        </p>
        <p className="mt-1 text-xs text-slate-500">
          CSV, XLSX, or XLS · up to 100 MB
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
            CSV
          </span>
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
            XLSX
          </span>
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
            XLS
          </span>
        </div>
      </div>
    );
  if (type === "results")
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-[#1b2c50]">
            Verification results
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            248 rows
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-3">
          <span className="rounded-lg bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
            Verified <strong className="ml-1 text-sm">184</strong>
          </span>
          <span className="rounded-lg bg-rose-50 p-3 text-xs font-bold text-rose-700">
            Invalid <strong className="ml-1 text-sm">32</strong>
          </span>
          <span className="rounded-lg bg-amber-50 p-3 text-xs font-bold text-amber-700">
            Errors <strong className="ml-1 text-sm">18</strong>
          </span>
          <span className="rounded-lg bg-slate-100 p-3 text-xs font-bold text-slate-600">
            Unknown <strong className="ml-1 text-sm">14</strong>
          </span>
        </div>
      </div>
    );
  if (type === "credits")
    return (
      <div className="rounded-2xl bg-gradient-to-br from-[#2c42b4] to-[#5b50bf] p-5 text-white shadow-lg shadow-indigo-200/60">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-100">
            Available credits
          </span>
          <CreditCard size={17} className="text-indigo-200" />
        </div>
        <p className="mt-4 text-3xl font-extrabold tracking-tight">184,732</p>
        <div className="mt-4 h-2 rounded-full bg-white/20">
          <div className="h-full w-[76%] rounded-full bg-indigo-200" />
        </div>
        <div className="mt-2 flex justify-between text-[10px] font-semibold text-indigo-100">
          <span>Remaining usage</span>
          <span>Limit 200,000</span>
        </div>
      </div>
    );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-indigo-100 bg-white p-4">
        <ShieldCheck className="text-[#5266cc]" size={20} />
        <p className="mt-3 text-sm font-bold text-[#1b2c50]">Approved access</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Workspace access is available after admin approval.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <UsersRound className="text-[#5266cc]" size={20} />
        <p className="mt-3 text-sm font-bold text-[#1b2c50]">
          Admin visibility
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Account access and latest activity stay reviewable.
        </p>
      </div>
    </div>
  );
}

function FeatureCarousel() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    let frame = 0;
    const move = () => {
      const carousel = carouselRef.current;
      if (carousel && !pausedRef.current) {
        const loopPoint = carousel.scrollWidth / 2;
        carousel.scrollLeft =
          carousel.scrollLeft >= loopPoint ? 0 : carousel.scrollLeft + 0.35;
      }
      frame = requestAnimationFrame(move);
    };
    frame = requestAnimationFrame(move);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      ref={carouselRef}
      className="feature-scroll mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5 [scrollbar-color:#c7cff5_transparent]"
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
      onTouchStart={() => {
        pausedRef.current = true;
      }}
      onTouchEnd={() => {
        pausedRef.current = false;
      }}
      onFocusCapture={() => {
        pausedRef.current = true;
      }}
      onBlurCapture={() => {
        pausedRef.current = false;
      }}
      aria-label="Product feature carousel"
    >
      {[...overviewFeatures, ...overviewFeatures].map(
        ([Icon, title, description], index) => (
          <article
            key={`${title}-${index}`}
            aria-hidden={index >= overviewFeatures.length}
            className="shine-button group min-w-[260px] snap-start rounded-2xl border border-slate-200 bg-[#fcfcff] p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/60 sm:min-w-[290px] lg:min-w-[305px]"
          >
            <span className="relative z-10 grid h-11 w-11 place-items-center rounded-xl bg-[#edf0ff] text-[#4356c9]">
              <Icon size={20} />
            </span>
            <h3 className="relative z-10 mt-5 text-base font-extrabold text-[#1b2c50]">
              {title}
            </h3>
            <p className="relative z-10 mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </article>
        ),
      )}
    </div>
  );
}

export default function Features() {
  const [selectedPackage, setSelectedPackage] = useState<PricingPackage | null>(
    null,
  );
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(
    null,
  );
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [manualPayment, setManualPayment] = useState<{
    purchaseId: string;
    instructions: {
      display_name: string;
      account_identifier: string;
      instructions: string;
      account_holder: string | null;
    } | null;
    status: string;
  } | null>(null);
  const [transactionReference, setTransactionReference] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [isSubmittingManualPayment, setIsSubmittingManualPayment] =
    useState(false);
  const { session } = useAuth();

  const continueToPayment = async () => {
    if (!selectedPackage || !selectedPayment) return;
    if (!session?.access_token) {
      setPaymentError("Please sign in before purchasing credits.");
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentError("");
    try {
      const provider = selectedPayment.provider as PaymentProviderId;
      const rpcDiagnostics = {
        requested_package_id: selectedPackage.packageId,
        requested_provider: provider,
        supabase_url: supabaseProjectUrl,
      };
      console.debug("Creating manual payment request", rpcDiagnostics);
      const { data: purchase, error: purchaseError } = await supabase.rpc(
        "create_manual_payment",
        {
          requested_package_id: selectedPackage.packageId,
          requested_provider: provider,
        },
      );
      if (purchaseError || !purchase) {
        const diagnostics = {
          code: purchaseError?.code,
          message: purchaseError?.message,
          details: purchaseError?.details,
          hint: purchaseError?.hint,
        };
        console.error("Unable to create manual payment request", diagnostics);
        setPaymentError(
          `Unable to create the manual payment request${diagnostics.message ? `: ${diagnostics.message}` : "."}${diagnostics.code ? ` (code: ${diagnostics.code})` : ""}`,
        );
        return;
      }

      const { data: instructions, error: instructionsError } = await supabase
        .from("payment_instructions")
        .select("display_name,account_identifier,instructions,account_holder")
        .eq("provider", provider)
        .eq("active", true)
        .single();
      if (instructionsError || !instructions) {
        console.error("Unable to load manual payment instructions", {
          code: instructionsError?.code,
          message: instructionsError?.message,
          details: instructionsError?.details,
          hint: instructionsError?.hint,
        });
        setPaymentError("Unable to load payment instructions. Please try again.");
        return;
      }

      setTransactionReference("");
      setPaymentNote("");
      setSubmissionMessage("");
      setManualPayment({
        purchaseId: purchase.id,
        status: purchase.status,
        instructions,
      });
    } catch (error) {
      console.error("Unexpected manual payment creation failure", error);
      setPaymentError(
        `Unable to create the manual payment request: ${error instanceof Error ? error.message : "Unexpected error"}`,
      );
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#fcfcff] text-[#152446]">
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_86%_15%,rgba(174,190,255,.48),transparent_24%),linear-gradient(180deg,#f9faff_0%,#fdfdff_100%)]">
        <div className="absolute left-1/2 top-16 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-100/40 blur-3xl" />
        <SiteHeader />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-32 sm:px-8 sm:pb-24 lg:grid-cols-[1.02fr_.98fr] lg:gap-16 lg:pb-32 lg:pt-44">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-bold text-[#4053bc] shadow-sm">
              <ShieldCheck size={14} /> Built for cleaner email data
            </div>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.06] tracking-[-.055em] text-[#102044] sm:text-5xl lg:text-[58px]">
              Powerful Email Verification{" "}
              <span className="bg-gradient-to-r from-[#364bc0] to-[#7466d5] bg-clip-text text-transparent">
                Features
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600">
              PureListVerifier helps you verify email lists, understand results,
              manage usage, and work with cleaner email data from one focused
              workspace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/access"
                className="shine-button inline-flex items-center justify-center gap-2 rounded-full bg-[#3349be] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-[#263aa5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5164d8] focus-visible:ring-offset-2"
              >
                Get Started <ArrowRight size={16} />
              </Link>
              <Link
                to="/how-it-works"
                className="shine-button inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-[#27385f] shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5164d8] focus-visible:ring-offset-2"
              >
                How It Works <ChevronRight size={16} />
              </Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[550px]">
            <div className="absolute -inset-7 -z-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-100 via-sky-50 to-violet-100 blur-2xl" />
            <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/80 shadow-[0_28px_80px_rgba(38,55,120,0.17)] backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#edf0ff] text-[#4558cc]">
                    <LayoutDashboard size={16} />
                  </span>
                  <span className="text-xs font-extrabold text-[#172448]">
                    Verification workspace
                  </span>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                  Ready to review
                </span>
              </div>
              <div className="grid gap-3 bg-[#f8faff] p-5 sm:grid-cols-[1.18fr_.82fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">
                      Recent list
                    </span>
                    <FileSpreadsheet size={15} className="text-[#5266cc]" />
                  </div>
                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5 text-xs">
                      <span className="font-semibold text-slate-600">
                        hello@company.com
                      </span>
                      <CheckCircle2 size={15} className="text-emerald-600" />
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2.5 text-xs">
                      <span className="font-semibold text-slate-600">
                        invalid@sample
                      </span>
                      <CircleAlert size={15} className="text-rose-500" />
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2.5 text-xs">
                      <span className="font-semibold text-slate-600">
                        team@domain.com
                      </span>
                      <CheckCircle2 size={15} className="text-[#5266cc]" />
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-[#3048ba] to-[#6257c4] p-4 text-white shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-[.14em] text-indigo-100">
                    Available credits
                  </span>
                  <p className="mt-3 text-3xl font-extrabold tracking-tight">
                    200,000
                  </p>
                  <div className="mt-4 h-2 rounded-full bg-white/20">
                    <div className="h-full w-4/5 rounded-full bg-indigo-200" />
                  </div>
                  <p className="mt-2 text-[10px] font-semibold text-indigo-100">
                    80% available
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white px-5 py-20 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#5266cc]">
              Feature overview
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-.045em] text-[#142448] sm:text-4xl">
              The essentials for a clearer verification workflow.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">
              Explore the product capabilities available in the PureListVerifier
              workspace, from list intake through result export and controlled
              access.
            </p>
          </div>
          <FeatureCarousel />
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#5266cc]">
              A closer look
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-.045em] text-[#142448] sm:text-4xl">
              Designed around the work that matters.
            </h2>
          </div>
          <div className="mt-14 space-y-16 lg:mt-20 lg:space-y-24">
            {details.map(
              ({ eyebrow, title, copy, points, Icon, visual }, index) => (
                <article
                  key={title}
                  className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20"
                >
                  <div className={index % 2 ? "lg:order-2" : ""}>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[#5266cc]">
                      <Icon size={15} /> {eyebrow}
                    </div>
                    <h3 className="mt-4 text-2xl font-extrabold tracking-[-.04em] text-[#17284c] sm:text-3xl">
                      {title}
                    </h3>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
                      {copy}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {points.map((point) => (
                        <li
                          key={point}
                          className="flex items-start gap-3 text-sm font-semibold text-[#2c3e68]"
                        >
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-indigo-50 text-[#5266cc]">
                            <Check size={12} strokeWidth={3} />
                          </span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className={`rounded-3xl border border-indigo-100 bg-gradient-to-br from-[#f2f4ff] via-white to-[#f9f8ff] p-5 shadow-[0_18px_55px_rgba(38,55,120,0.08)] sm:p-8 ${index % 2 ? "lg:order-1" : ""}`}
                  >
                    <FeatureVisual type={visual} />
                  </div>
                </article>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white px-5 py-20 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#5266cc]">
              Flexible usage
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-.045em] text-[#142448] sm:text-4xl">
              Extra Credits Pricing
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Purchase additional verification credits when your included
              credits are not enough.
              <br />
              Choose the package that fits your upcoming verification work.
            </p>
          </div>
          <div className="mt-14 grid items-stretch gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-5">
            {pricing.map((plan, index) => {
              const selected = selectedPackage?.credits === plan.credits;
              return (
                <button
                  key={plan.credits}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedPackage(plan)}
                  style={{ overflow: "visible" }}
                  className={`shine-button relative flex min-w-0 flex-col rounded-2xl border p-5 pt-6 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5164d8] focus-visible:ring-offset-2 ${selected ? "border-indigo-400 bg-gradient-to-b from-[#eef1ff] to-white shadow-lg shadow-indigo-100" : index === 2 ? "border-indigo-300 bg-gradient-to-b from-[#f5f6ff] to-white" : "border-slate-200 bg-[#fcfcff]"}`}
                >
                  {index === 2 && (
                    <span className="absolute -top-4 left-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-[#3349be] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-white shadow-md shadow-indigo-200">
                      <span aria-hidden="true">♛</span> Recommended
                    </span>
                  )}
                  <span className="relative z-10 text-sm font-bold text-[#5266cc]">
                    {plan.credits}
                  </span>
                  <span className="relative z-10 mt-4 text-4xl font-extrabold tracking-[-.05em] text-[#17284c]">
                    {plan.price}
                  </span>
                  <span className="relative z-10 mt-3 min-h-10 text-xs leading-5 text-slate-500">
                    {plan.description}
                  </span>
                  <span className="relative z-10 mt-5 space-y-2.5">
                    {plan.points.map((point) => (
                      <span
                        key={point}
                        className="flex gap-2 text-xs font-semibold leading-5 text-[#34466f]"
                      >
                        <Check
                          size={14}
                          strokeWidth={3}
                          className="mt-0.5 shrink-0 text-[#5266cc]"
                        />
                        {point}
                      </span>
                    ))}
                  </span>
                  <span
                    className={`relative z-10 mt-6 inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-bold ${selected ? "bg-[#3349be] text-white" : "border border-indigo-100 bg-white text-[#4053bc]"}`}
                  >
                    {selected ? "Package selected" : "Select package"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-20 rounded-[2rem] border border-slate-200 bg-[#fbfcff] p-5 shadow-[0_20px_60px_rgba(38,55,120,0.08)] sm:p-8 lg:p-10">
            <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[#5266cc]">
                  Payment options
                </p>
                <h3 className="mt-3 text-2xl font-extrabold tracking-[-.04em] text-[#142448] sm:text-3xl">
                  Manual Payment Verification
                </h3>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Choose a payment method, follow the configured payment
                  instructions, and submit your transaction for admin
                  verification.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <ShieldCheck size={14} /> Admin review required
              </span>
            </div>
            <div className="mx-auto mt-8 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {paymentMethods.map((method) => {
                const selected = selectedPayment?.name === method.name;
                const MethodIcon = method.Icon;
                return (
                  <button
                    key={method.name}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedPayment(method)}
                    className={`shine-button flex min-w-0 items-center gap-3 rounded-xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5164d8] focus-visible:ring-offset-2 ${selected ? "border-indigo-400 bg-indigo-50/70 shadow-md shadow-indigo-100" : "border-slate-200 bg-[#fcfcff]"}`}
                  >
                    <span
                      className={`relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-xl ${method.iconClass}`}
                    >
                      <MethodIcon
                        size={21}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="relative z-10 min-w-0 flex-1">
                      <span className="block text-sm font-extrabold text-[#1b2c50]">
                        {method.name}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        {method.description}
                      </span>
                    </span>
                    {selected ? (
                      <CheckCircle2
                        className="relative z-10 shrink-0 text-[#4053bc]"
                        size={18}
                        aria-label="Selected"
                      />
                    ) : (
                      <span className="relative z-10 h-4 w-4 shrink-0 rounded-full border border-slate-300" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-indigo-100 bg-gradient-to-br from-[#f5f6ff] to-white p-5 shadow-sm sm:p-7">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8ecff] text-[#4053bc]">
                  <Smartphone size={19} />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-[#1b2c50]">
                    Order Summary
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review your selected package and payment method
                  </p>
                </div>
              </div>
              <dl className="mt-5 grid gap-3 border-y border-indigo-100/80 py-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Package
                  </dt>
                  <dd className="mt-1 font-bold text-[#26385f]">
                    {selectedPackage?.credits ?? "Choose a package"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Price
                  </dt>
                  <dd className="mt-1 font-bold text-[#26385f]">
                    {selectedPackage?.price ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Payment method
                  </dt>
                  <dd className="mt-1 font-bold text-[#26385f]">
                    {selectedPayment?.name ?? "Choose a payment method"}
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                disabled={
                  !selectedPackage || !selectedPayment || isSubmittingPayment
                }
                onClick={continueToPayment}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#3349be] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-[#263aa5] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
              >
                <CreditCard size={16} />{" "}
                {isSubmittingPayment
                  ? "Starting payment…"
                  : "Continue to Payment"}
              </button>
              {paymentError && (
                <p
                  role="alert"
                  className="mt-3 text-center text-sm font-semibold text-rose-600"
                >
                  {paymentError}
                </p>
              )}
              <p className="mt-3 text-center text-xs text-slate-500">
                This selection is for planning only. No payment or credits are
                processed.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-[#1e328e] to-[#5349ad] px-6 py-14 text-center text-white shadow-xl shadow-indigo-200 sm:px-12">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-200">
            Next step
          </p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-.045em] sm:text-4xl">
            Ready to Start Verifying?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-indigo-100">
            Create or access your account to continue to the PureListVerifier
            workspace.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/access"
              className="shine-button inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-bold text-[#263b9e] shadow-sm transition hover:bg-indigo-50"
            >
              Get Started <ArrowRight size={16} />
            </Link>
            <Link
              to="/how-it-works"
              className="shine-button inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              How It Works <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      {manualPayment && (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/45 p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="manual-payment-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[#5266cc]">
                  Manual Payment Verification
                </p>
                <h2
                  id="manual-payment-title"
                  className="mt-2 text-xl font-extrabold text-[#17223b]"
                >
                  Payment Status:{" "}
                  {manualPayment.status === "rejected"
                    ? "Rejected"
                    : manualPayment.status === "fulfilled"
                      ? "Fulfilled"
                      : "Pending Verification"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setManualPayment(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 rounded-xl bg-[#f7f9ff] p-4 text-sm">
              <dl className="grid gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-400">Package</dt>
                  <dd className="font-bold text-[#26385f]">
                    {selectedPackage?.credits}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Price</dt>
                  <dd className="font-bold text-[#26385f]">
                    {selectedPackage?.price}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Payment method</dt>
                  <dd className="font-bold text-[#26385f]">
                    {selectedPayment?.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Credit amount</dt>
                  <dd className="font-bold text-[#26385f]">
                    {selectedPackage?.credits}
                  </dd>
                </div>
              </dl>
            </div>
            {manualPayment.instructions ? (
              <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <p className="text-sm font-extrabold text-[#26385f]">
                  {manualPayment.instructions.display_name}
                </p>
                {manualPayment.instructions.account_holder && (
                  <p className="mt-1 text-xs text-slate-600">
                    Account holder: {manualPayment.instructions.account_holder}
                  </p>
                )}
                <p className="mt-2 break-all font-bold text-[#26385f]">
                  {manualPayment.instructions.account_identifier}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {manualPayment.instructions.instructions}
                </p>
              </div>
            ) : (
              <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-700">
                Payment instructions have not been configured for this method
                yet. Please contact an administrator.
              </p>
            )}
            {manualPayment.status === "pending_payment" && (
              <form
                className="mt-5 space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setSubmissionMessage("");
                  setIsSubmittingManualPayment(true);
                  const { error } = await supabase.rpc(
                    "submit_manual_payment",
                    {
                      target_purchase_id: manualPayment.purchaseId,
                      submitted_transaction_reference: transactionReference,
                      submitted_note: paymentNote || null,
                    },
                  );
                  setIsSubmittingManualPayment(false);
                  if (error) {
                    console.error("Unable to submit manual payment", {
                      code: error.code,
                      message: error.message,
                      details: error.details,
                      hint: error.hint,
                    });
                    setSubmissionMessage(
                      "Unable to submit the payment for review. Please try again.",
                    );
                    return;
                  }
                  setManualPayment((current) =>
                    current
                      ? { ...current, status: "submitted_for_review" }
                      : current,
                  );
                  setSubmissionMessage(
                    "Payment submitted successfully. Your payment is pending verification.",
                  );
                }}
              >
                <label className="block text-sm font-bold text-[#26385f]">
                  Transaction ID / Reference Number
                  <input
                    required
                    value={transactionReference}
                    onChange={(event) =>
                      setTransactionReference(event.target.value)
                    }
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-400"
                  />
                </label>
                <label className="block text-sm font-bold text-[#26385f]">
                  Optional note
                  <textarea
                    value={paymentNote}
                    onChange={(event) => setPaymentNote(event.target.value)}
                    className="mt-2 min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-400"
                  />
                </label>
                <p className="text-xs text-slate-500">
                  Never submit a PIN, OTP, password, CVV, card number, or
                  banking login credentials.
                </p>
                <button
                  type="submit"
                  disabled={isSubmittingManualPayment}
                  className="w-full rounded-full bg-[#3349be] px-4 py-3 text-sm font-bold text-white hover:bg-[#263aa5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingManualPayment
                    ? "Submitting…"
                    : "Submit for Verification"}
                </button>
              </form>
            )}
            {submissionMessage && (
              <p
                role="status"
                className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700"
              >
                {submissionMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
