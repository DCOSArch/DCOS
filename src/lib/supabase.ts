import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn('VITE_SUPABASE_URL is missing! Please ensure your Vercel Environment Variables use the VITE_ prefix (e.g., VITE_SUPABASE_URL).');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
