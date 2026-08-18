import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  getSession, fetchProfile, fetchMyWorkbookAccess, signIn, signOut, onAuthStateChange, isAdmin,
} from "../lib/auth.js";
import { isSupabaseEnabled } from "../lib/supabase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [workbookAccess, setWorkbookAccess] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);

  const loadUserData = useCallback(async (userId) => {
    const p = await fetchProfile(userId);
    setProfile(p);
    if (p && !isAdmin(p)) {
      const ids = await fetchMyWorkbookAccess(userId);
      setWorkbookAccess(ids);
    } else {
      setWorkbookAccess([]);
    }
    return p;
  }, []);

  const refreshAccess = useCallback(async () => {
    if (!session?.user?.id || isAdmin(profile)) return;
    const ids = await fetchMyWorkbookAccess(session.user.id);
    setWorkbookAccess(ids);
  }, [session?.user?.id, profile]);

  useEffect(() => {
    if (!isSupabaseEnabled()) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const s = await getSession();
        if (!mounted) return;
        setSession(s);
        if (s?.user?.id) await loadUserData(s.user.id);
      } catch (e) {
        console.error("Auth init failed", e);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    })();

    const { data: sub } = onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s?.user?.id) {
        await loadUserData(s.user.id);
      } else {
        setProfile(null);
        setWorkbookAccess([]);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadUserData]);

  const login = async (email, password) => {
    const { session: s } = await signIn(email, password);
    setSession(s);
    if (s?.user?.id) {
      const p = await loadUserData(s.user.id);
      if (!p) throw new Error("Profile not found. Ask the owner to run auth.sql and set your account up.");
      return p;
    }
    throw new Error("Login failed");
  };

  const logout = async () => {
    await signOut();
    setSession(null);
    setProfile(null);
    setWorkbookAccess([]);
  };

  const value = {
    session,
    profile,
    workbookAccess,
    authLoading,
    isAdmin: isAdmin(profile),
    login,
    logout,
    refreshAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
