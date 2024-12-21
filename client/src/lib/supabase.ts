import { createClient, SupabaseClient, User, AuthError } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const redirectUrl = import.meta.env.VITE_REDIRECT_URL || window.location.origin;
const apiExternalUrl = import.meta.env.VITE_API_EXTERNAL_URL;
const authExternalUrl = import.meta.env.VITE_AUTH_EXTERNAL_URL;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage,
    emailAuth: {
      redirectTo: `${redirectUrl}/auth/callback`,
      autoConfirm: false,
    },
    url: authExternalUrl,
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-v2',
    },
  },
});

// Auth related types
export interface AuthSession {
  user: User | null;
  error: AuthError | null;
}

export interface AuthResponse {
  session: AuthSession | null;
  user: User | null;
  error: AuthError | null;
}

// Type for common database entities
export interface Item {
  id: string;
  created_at: string;
  name: string;
  description: string;
  category: string;
  image_url?: string;
}

// Auth methods
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error);
    return null;
  }
};

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${redirectUrl}/auth/callback`,
        data: {
          name: email.split('@')[0],
        },
      },
    });
    
    if (error) throw error;
    
    if (data?.user && !data.user.confirmed_at) {
      return {
        user: data.user,
        message: 'Please check your email for the confirmation link.'
      };
    }
    
    return data;
  } catch (error) {
    console.error('Sign up error:', error);
    handleSupabaseError(error);
    return null;
  }
};

export const sendMagicLink = async (email: string) => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${redirectUrl}/auth/callback`,
        shouldCreateUser: true,
        data: {
          name: email.split('@')[0],
        },
      },
    });

    if (error) throw error;
    
    return { 
      success: true,
      message: 'Check your email for the magic link.'
    };
  } catch (error) {
    console.error('Magic link error:', error);
    handleSupabaseError(error);
    return null;
  }
};

// Enhanced error handling with type information and specific email error handling
export const handleSupabaseError = (error: AuthError | Error | unknown) => {
  console.error('Supabase error:', error);

  if (error instanceof Error) {
    // Handle email service errors (500 status)
    if ('status' in error && error.status === 500) {
      if (error.message.includes('confirmation mail') || error.message.includes('verification email')) {
        throw new Error(
          'Unable to send verification email. Please try again in a few minutes or use password authentication.'
        );
      }
      throw new Error('A server error occurred. Please try again in a few minutes.');
    }

    // Handle specific auth errors
    if ('status' in error && typeof error.status === 'number') {
      switch (error.status) {
        case 400:
          if (error.message.includes('Email rate limit exceeded')) {
            throw new Error('Too many attempts. Please try again in a few minutes.');
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Please check your email and confirm your account before signing in.');
          }
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. Please try again.');
          }
          throw new Error('Invalid request. Please check your input.');
        case 401:
          throw new Error('Authentication required. Please sign in.');
        case 403:
          throw new Error('You don\'t have permission to perform this action.');
        case 404:
          throw new Error('Email not found. Please check your email address or sign up.');
        case 422:
          if (error.message.includes('already registered')) {
            throw new Error('This email is already registered. Please sign in with your password.');
          }
          if (error.message.includes('Password')) {
            throw new Error('Password must be at least 6 characters long and contain both letters and numbers.');
          }
          throw new Error('Invalid input format.');
        case 429:
          throw new Error('Too many requests. Please try again in a few minutes.');
        default:
          throw new Error(error.message || 'An unexpected error occurred.');
      }
    }

    // Handle network errors
    if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
      throw new Error(
        'Unable to connect to the authentication service. Please check your internet connection and try again.'
      );
    }

    // Handle general errors
    throw new Error(error.message || 'An unexpected error occurred.');
  }
  
  throw new Error('An unexpected error occurred while processing your request.');
};

// Session management utilities
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    handleSupabaseError(error);
    return null;
  }
};

export const refreshSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return session;
  } catch (error) {
    handleSupabaseError(error);
    return null;
  }
}; 