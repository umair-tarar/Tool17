import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type AccessStatus = "pending" | "approved" | "rejected" | "revoked";
type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "user" | "admin";
  access_status: AccessStatus;
};
type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const profileRequest = useRef(0);

  const refreshProfile = async () => {
    const requestId = ++profileRequest.current;
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      if (requestId !== profileRequest.current) return;
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,role,access_status")
      .eq("id", user.id)
      .single();
    if (requestId !== profileRequest.current) return;
    setProfile(error ? null : (data as Profile | null));
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
        setLoading(false);
        return;
      }
      if (event === "SIGNED_OUT") setIsPasswordRecovery(false);
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED"
      ) {
        setProfile(null);
        void refreshProfile();
      }
    });

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return;
      setSession(currentSession);
      refreshProfile().finally(() => mounted && setLoading(false));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      isPasswordRecovery,
      refreshProfile,
    }),
    [session, profile, loading, isPasswordRecovery],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
