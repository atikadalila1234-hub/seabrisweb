import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  console.error(
    '[SEABRIS] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi. ' +
      'Isi di file .env (lokal) atau Environment variables (Netlify).'
  );
}

// Hanya pakai anon/publishable key di frontend. JANGAN pernah taruh secret key di sini.
export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'missing-key');