import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, type SupabaseSession } from '@/lib/supabaseClient';

export type AuthMode = 'account' | 'guest' | null;

interface AuthContextType {
  session: SupabaseSession;
  authMode: AuthMode;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<{ ok: boolean; needsEmailConfirm?: boolean }>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Guest mode has no Supabase session at all -- it's tracked with a plain
// local flag so a returning guest skips straight past the auth screen
// instead of being asked to sign up every time they reopen the app.
const GUEST_KEY = 'solid_auth_guest';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SupabaseSession>(null);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }: { data: { session: SupabaseSession } }) => {
      if (!mounted) return;
      const activeSession = data?.session ?? null;
      setSession(activeSession);
      if (activeSession) {
        setAuthMode('account');
      } else if (localStorage.getItem(GUEST_KEY) === '1') {
        setAuthMode('guest');
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, newSession: SupabaseSession) => {
      setSession(newSession ?? null);
      if (newSession) {
        setAuthMode('account');
        localStorage.removeItem(GUEST_KEY);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({ email, password });
    if (err) {
      setError(err.message || 'Could not create your account.');
      return { ok: false };
    }
    if (data?.session) {
      setSession(data.session);
      setAuthMode('account');
      localStorage.removeItem(GUEST_KEY);
      return { ok: true };
    }
    // The project requires confirming the email address before a session
    // is issued -- there's no session yet, so stay on the auth screen and
    // tell the person to check their inbox, then log in.
    return { ok: true, needsEmailConfirm: true };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message || 'Could not sign you in.');
      return false;
    }
    setSession(data?.session ?? null);
    setAuthMode('account');
    localStorage.removeItem(GUEST_KEY);
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAuthMode(null);
    localStorage.removeItem(GUEST_KEY);
  }, []);

  const continueAsGuest = useCallback(() => {
    localStorage.setItem(GUEST_KEY, '1');
    setAuthMode('guest');
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ session, authMode, loading, error, signUp, signIn, signOut, continueAsGuest, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
