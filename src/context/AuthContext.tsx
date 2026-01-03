import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Supabase isn't configured, just stop loading and stay in guest mode
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  const signInAsGuest = () => {
    // Create a virtual user object for the session
    const guestUser: User = {
      id: 'guest',
      app_metadata: {},
      user_metadata: { full_name: 'Guest Master' },
      aud: 'authenticated',
      created_at: new Date().toISOString()
    };
    setUser(guestUser);
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured || !supabase) {
      console.error("[Auth] Cloud auth not configured.");
      throw new Error("Cloud authentication is not configured.");
    }

    // Check for dynamic preview domains which break Google Auth
    const isDynamicPreview = window.location.hostname.includes('scf.usercontent.goog');
    if (isDynamicPreview) {
      console.warn("Dynamic Preview Domain detected. Google Auth is unreliable here.");
    }

    console.log("[Auth] Starting Google Sign-In sequence...");
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true 
        }
      });

      if (error) throw error;

      if (data?.url) {
        console.log("[Auth] Redirecting to:", data.url);
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("[Auth] Sign In Exception:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, signInWithGoogle, signInAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};