import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { useGestation } from "@/hooks/useGestation";


function toDateFromYMD(ymd: string) {
  // interpreta YYYY-MM-DD como data local (sem fuso)
  const [y,m,d] = ymd.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function useGestation() {
  const [loading, setLoading] = useState(true);
  const [lmpYmd, setLmpYmd] = useState<string | null>(null); // <-- string YYYY-MM-DD
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUid(user.id);

      await supabase.from('profiles').upsert({ id: user.id }).select();

      const { data } = await supabase
        .from('profiles')
        .select('lmp_date')
        .eq('id', user.id)
        .maybeSingle();

      if (data?.lmp_date) setLmpYmd(String(data.lmp_date)); // já vem como YYYY-MM-DD
      setLoading(false);
    })();
  }, []);

  async function saveLmpDate(ymd: string) {
    if (!uid) return;
    setLmpYmd(ymd);
    await supabase.from('profiles').update({ lmp_date: ymd }).eq('id', uid);
  }

  const calc = useMemo(() => {
    if (!lmpYmd) return null;
    const lmpDate = toDateFromYMD(lmpYmd);
    const ms = Date.now() - lmpDate.getTime();
    const week = Math.max(1, Math.floor(ms / (1000*60*60*24*7)) + 1);
    const due = new Date(lmpDate); due.setDate(due.getDate() + 280);
    const daysRemaining = Math.max(0, Math.ceil((due.getTime() - Date.now())/(1000*60*60*24)));
    const trimester = week <= 13 ? 1 : week <= 27 ? 2 : 3;
    return { week, trimester, due, daysRemaining, lmpDate };
  }, [lmpYmd]);

  return { loading, lmpYmd, saveLmpDate, calc };
}
