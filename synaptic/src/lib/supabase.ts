/**
 * Supabase Client Configuration
 * Creates and exports the Supabase client for database operations.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// During build time or when env vars are missing, use a placeholder URL
// so the client can be constructed without crashing. Actual calls will fail
// gracefully at runtime if credentials are not configured.
const safeUrl = supabaseUrl || 'https://placeholder.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder-key';

export const supabase: SupabaseClient = createClient(safeUrl, safeKey);

/** Check if Supabase is properly configured */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
