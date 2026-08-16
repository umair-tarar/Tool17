import "./global.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/lib/AuthProvider";
import { supabase } from "@/lib/supabase";
import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import HowItWorks from "./pages/HowItWorks";
import Testimonials from "./pages/Testimonials";
import Faq from "./pages/Faq";
import EmailConfirmed from "./pages/EmailConfirmed";
import Admin from "./pages/Admin";
import Access from "./pages/Access";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [hash, pathname]);

  return null;
}

function PasswordRecoveryRedirect() {
  const { isPasswordRecovery } = useAuth();
  const location = useLocation();

  if (isPasswordRecovery && location.pathname !== "/reset-password") {
    return <Navigate to="/reset-password" replace />;
  }

  return null;
}

function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f9fc] text-sm text-[#71809d]">
        Checking access...
      </main>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const isAdmin = profile?.role === "admin";
  const hasWorkspaceAccess = isAdmin || profile?.access_status === "approved";

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!hasWorkspaceAccess) {
    const message =
      profile?.access_status === "rejected"
        ? "Your account access request was rejected."
        : profile?.access_status === "revoked"
          ? "Your account access has been revoked. Please contact the administrator."
          : "Your account is pending approval. Please wait until an administrator approves your account.";
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f9fc] px-5 text-center text-[#17223b]">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-extrabold">Access restricted</h1>
          <p className="mt-3 text-sm text-[#71809d]">{message}</p>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="mt-6 rounded-full bg-[#3155e8] px-5 py-3 text-sm font-bold text-white"
          >
            Log out
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <PasswordRecoveryRedirect />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/testimonials" element={<Testimonials />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/access" element={<Access />} />
            <Route path="/email-confirmed" element={<EmailConfirmed />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

let root: ReturnType<typeof createRoot> | null = null;

function renderApp() {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  if (!root) {
    root = createRoot(rootElement);
  }
  root.render(<App />);
}

renderApp();

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    renderApp();
  });
}
