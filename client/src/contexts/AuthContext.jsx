import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsModalOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendMagicLink = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const verifyCode = async (email, token) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      token,
    });

    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      isModalOpen,
      setIsModalOpen,
      sendMagicLink,
      verifyCode,
      signOut
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
}; 