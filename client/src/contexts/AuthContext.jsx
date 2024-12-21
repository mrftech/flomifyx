import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, handleSupabaseError, getSession, refreshSession, signInWithEmail, signUpWithEmail } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [authMode, setAuthMode] = useState('magic-link'); // 'magic-link' | 'password'
  const MAX_RETRIES = 3;

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const session = await getSession();
        setUser(session?.user ?? null);
        setAuthError(null);
        setRetryCount(0);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError(error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setIsModalOpen(false);
        setAuthError(null);
        setRetryCount(0);
      }

      // Handle token refresh
      if (event === 'TOKEN_REFRESHED') {
        try {
          await refreshSession();
        } catch (error) {
          console.error('Token refresh error:', error);
          setAuthError(error.message);
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const sendMagicLink = useCallback(async (email) => {
    try {
      setAuthError(null);
      
      // Check if we've exceeded retry attempts
      if (retryCount >= MAX_RETRIES) {
        setAuthMode('password'); // Switch to password auth after max retries
        throw new Error(
          'Maximum retry attempts reached. Please try signing in with email and password instead.'
        );
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
          shouldCreateUser: true,
        },
      });

      if (error) {
        // Log the error for debugging
        console.error('Magic link error:', error);
        
        // Increment retry count for 500 errors
        if (error.status === 500) {
          setRetryCount(prev => prev + 1);
          if (prev + 1 >= MAX_RETRIES) {
            setAuthMode('password'); // Switch to password auth after max retries
          }
        }
        
        throw error;
      }

      // Reset retry count on success
      setRetryCount(0);
      return { success: true };
    } catch (error) {
      const formattedError = handleSupabaseError(error);
      setAuthError(formattedError.message);
      throw formattedError;
    }
  }, [retryCount]);

  const signIn = useCallback(async (email, password) => {
    try {
      setAuthError(null);
      const data = await signInWithEmail(email, password);
      if (data?.user) {
        setAuthMode('magic-link'); // Reset to magic link for next time
        setRetryCount(0);
      }
      return data;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email, password) => {
    try {
      setAuthError(null);
      const data = await signUpWithEmail(email, password);
      if (data?.user) {
        setAuthMode('magic-link'); // Reset to magic link for next time
        setRetryCount(0);
      }
      return data;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  }, []);

  const verifyCode = useCallback(async (email, token) => {
    try {
      setAuthError(null);
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'magiclink',
      });

      if (error) {
        // Log the error for debugging
        console.error('Verification error:', error);
        throw error;
      }

      // Reset retry count on success
      setRetryCount(0);
      setAuthMode('magic-link'); // Reset to magic link for next time
      return { success: true };
    } catch (error) {
      const formattedError = handleSupabaseError(error);
      setAuthError(formattedError.message);
      throw formattedError;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setAuthError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Reset states on sign out
      setRetryCount(0);
      setAuthMode('magic-link');
    } catch (error) {
      const formattedError = handleSupabaseError(error);
      setAuthError(formattedError.message);
      throw formattedError;
    }
  }, []);

  const value = {
    user,
    loading,
    isModalOpen,
    setIsModalOpen,
    sendMagicLink,
    verifyCode,
    signIn,
    signUp,
    signOut,
    authError,
    retryCount,
    MAX_RETRIES,
    authMode,
    setAuthMode,
  };

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 