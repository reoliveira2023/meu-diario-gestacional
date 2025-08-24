import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // mantém seu caminho atual

export function useGestation() {
  const [loading, setLoading] = useState(true);
  const [lmpDate, setLmpDate] = useState<Date | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUid(user.id);

      // garante que o profile exista
      await supabase.from('profiles').upsert({ id: user.id }).select();

      const { data, error } = await supabase
        .from('profiles')
        .select('lmp_date')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data?.lmp_date) setLmpDate(new Date(data.lmp_date));
      setLoading(false);
    })();
  }, []);

  async function saveLmpDate(date: Date) {
    if (!uid) return;
    setLmpDate(date);
    await supabase
      .from('profiles')
      .update({ lmp_date: date.toISOString().slice(0,10) }) // salva YYYY-MM-DD
      .eq('id', uid);
  }

  const calc = useMemo(() => {
    if (!lmpDate) return null;
    const ms = Date.now() - lmpDate.getTime();
    const week = Math.max(1, Math.floor(ms / (1000*60*60*24*7)) + 1);
    const due = new Date(lmpDate);
    due.setDate(due.getDate() + 280); // ~40 semanas
    const daysRemaining = Math.max(0, Math.ceil((due.getTime() - Date.now())/(1000*60*60*24)));
    const trimester = week <= 13 ? 1 : week <= 27 ? 2 : 3;
    return { week, trimester, due, daysRemaining };
  }, [lmpDate]);

  return { loading, lmpDate, saveLmpDate, calc };
}
