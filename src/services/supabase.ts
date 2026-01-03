import { createClient } from '@supabase/supabase-js';

// Configuration provided by the user
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Check if configuration exists
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));

// Debug logs
if (isSupabaseConfigured) {
  console.log("[Supabase] Initializing client...");
  console.log("[Supabase] Project URL:", supabaseUrl);
  console.log("[Supabase] Key Length:", supabaseAnonKey?.length);
} else {
  console.error("[Supabase] MISSING CREDENTIALS. Check your environment variables.");
}

// Initialize client
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null as any;
