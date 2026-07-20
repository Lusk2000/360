/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.startsWith('http')) ? import.meta.env.VITE_SUPABASE_URL : 'https://ipmtnzsdgbtibaekaldj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbXRuenNkZ2J0aWJhZWthbGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NDI3ODQsImV4cCI6MjA5MDExODc4NH0.E7sSG2t4njgstz2ge9YhHgx8uxxjpDfTDy5FOc0UwPc';

if (typeof window !== 'undefined') {
  console.log('[Supabase] Conectando a:', supabaseUrl);
}

export const supabase = createClient(supabaseUrl || 'https://ipmtnzsdgbtibaekaldj.supabase.co', supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbXRuenNkZ2J0aWJhZWthbGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NDI3ODQsImV4cCI6MjA5MDExODc4NH0.E7sSG2t4njgstz2ge9YhHgx8uxxjpDfTDy5FOc0UwPc', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
});
