import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'operador' | 'consulta';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  canEdit: boolean;
  canDelete: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const canEdit = role === 'admin' || role === 'operador';
  const canDelete = role === 'admin';

  useEffect(() => {
    let mounted = true;
    console.log('[Auth] Starting initialization...');

    const fetchUserRole = async (userId: string) => {
      console.log('[Auth] Fetching role for user:', userId);
      try {
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
        
        console.log('[Auth] Role fetch result:', { roleData, error });
        
        if (mounted) {
          setRole(roleData?.role as AppRole ?? 'consulta');
        }
      } catch (error) {
        console.error('[Auth] Error fetching user role:', error);
        if (mounted) {
          setRole('consulta');
        }
      }
    };

    // Check for existing session first
    const initializeAuth = async () => {
      console.log('[Auth] initializeAuth called');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('[Auth] getSession result:', { session: !!session, error });
        
        if (!mounted) {
          console.log('[Auth] Component unmounted, aborting');
          return;
        }
        
        if (error) {
          console.error('[Auth] Error getting session:', error);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserRole(session.user.id);
        }
        
        console.log('[Auth] Initialization complete');
      } catch (error) {
        console.error('[Auth] Error initializing auth:', error);
      } finally {
        console.log('[Auth] Setting loading to false');
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    initializeAuth();

    // Set up auth state listener for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserRole(session.user.id);
        } else {
          setRole(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      role,
      loading,
      canEdit,
      canDelete,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
