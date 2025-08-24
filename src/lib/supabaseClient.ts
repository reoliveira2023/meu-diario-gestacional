// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error(
    '[supabaseClient] Faltam variáveis VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY. ' +
    'Adicione-as na Vercel (Settings → Environment Variables).'
  );
}

export const supabase = createClient(url as string, anon as string);
