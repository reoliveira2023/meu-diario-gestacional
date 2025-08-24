// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Vite usa VITE_*; mas fazemos fallback para NEXT_PUBLIC_* (que você já configurou na Vercel)
const url =
  import.meta.env.VITE_SUPABASE_URL ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL;

const anon =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.warn('[supabaseClient] Variáveis não encontradas. Defina VITE_SUPABASE_URL/KEY ou NEXT_PUBLIC_SUPABASE_URL/KEY.');
}

export const supabase = createClient(url as string, anon as string);
