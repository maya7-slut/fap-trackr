import { createClient } from '@supabase/supabase-js';

// Helper to safely get env vars without crashing
const getEnvVar = (key: string): string | undefined => {
  try {
    // Check if import.meta and import.meta.env exist
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      return (import.meta as any).env[key];
    }
  } catch (e) {
    // Ignore errors in environments where import.meta is not supported
  }
  return undefined;
};

// Strictly read from environment - NO HARDCODED FALLBACKS
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY');

// Check if configuration exists
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));

// Debug logs
if (isSupabaseConfigured) {
  console.log("[Supabase] Initializing client...");
} else {
  console.log("[Supabase] No credentials found. Running in local/guest mode.");
}

// Initialize client only if configured
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null as any;