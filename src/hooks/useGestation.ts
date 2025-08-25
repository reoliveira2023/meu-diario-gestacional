// src/hooks/useGestation.ts
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Converte "YYYY-MM-DD" -> Date (sem fuso)
function toDateFromYMD(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function useGestation() {
  const [loading, setLoading] = useState(true);
  const [lmpYmd, setLmpYmd] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr) console.error('[useGestation] getUser', authErr);
      if (!user) { setLoading(false); return; }
      setUid(user.id);

      // garante que existe um profile
      const { error: upsertErr } = await supabase.from('profiles').upsert({ id: user.id });
      if (upsertErr) console.error('[useGestation] upsert profile', upsertErr);

      // lê lmp_date
      const { data, error } = await supabase
        .from('profiles')
        .select('lmp_date')
        .eq('id', user.id)
        .maybeSingle();

      if (error) console.error('[useGestation] select lmp_date', error);
      if (data?.lmp_date) setLmpYmd(String(data.lmp_date)); // já vem YYYY-MM-DD
      setLoading(false);
    })();
  }, []);

  async function saveLmpDate(ymd: string) {
    if (!uid) return;
    setLmpYmd(ymd);
    const { error } = await supabase.from('profiles').update({ lmp_date: ymd }).eq('id', uid);
    if (error) console.error('[useGestation] update lmp_date', error);
  }

  const calc = useMemo(() => {
    if (!lmpYmd) return null;
    const lmpDate = toDateFromYMD(lmpYmd);
    const ms = Date.now() - lmpDate.getTime();
    const week = Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24 * 7)) + 1);
    const due = new Date(lmpDate); due.setDate(due.getDate() + 280);
    const daysRemaining = Math.max(0, Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    const trimester = week <= 13 ? 1 : week <= 27 ? 2 : 3;
    return { week, trimester, due, daysRemaining, lmpDate };
  }, [lmpYmd]);

  return { loading, lmpYmd, saveLmpDate, calc };
}
