import { useEffect, useMemo, useState } from "react";
// ⚠️ IMPORT RELATIVO para evitar erro "supabase is not defined"
import { supabase } from "../integrations/supabase/client";

/** Converte "YYYY-MM-DD" -> Date (sem fuso) */
function toDateFromYMD(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function useGestation() {
  const [loading, setLoading] = useState(true);
  const [lmpYmd, setLmpYmd] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);

      // 1) Usuário logado
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr) console.error("[useGestation] getUser", authErr);
      if (!user) { setLoading(false); return; }
      setUid(user.id);

      // 2) Garante que o profile existe (sem upsert para evitar erro de colunas NOT NULL)
      const { data: existing, error: selErr } = await supabase
        .from("profiles")
        .select("id,lmp_date")
        .eq("id", user.id)
        .maybeSingle();

      if (selErr) console.error("[useGestation] select profile", selErr);

      if (!existing) {
        const { error: insErr } = await supabase
          .from("profiles")
          .insert({ id: user.id });

        // 23505 = duplicate key (corrida); pode ignorar
        if (insErr && (insErr as any).code !== "23505") {
          console.error("[useGestation] insert profile", insErr);
        }
      } else {
        if (existing.lmp_date) {
          setLmpYmd(String(existing.lmp_date)); // já vem YYYY-MM-DD
        }
      }

      setLoading(false);
    })();
  }, []);

  /** Salva a LMP (YYYY-MM-DD) no Supabase */
  async function saveLmpDate(ymd: string) {
    if (!uid) return;
    setLmpYmd(ymd);

    const { error } = await supabase
      .from("profiles")
      .update({ lmp_date: ymd })
      .eq("id", uid);

    if (error) {
      console.error("[useGestation] update lmp_date", {
        code: (error as any).code,
        message: (error as any).message,
        details: (error as any).details,
        hint: (error as any).hint,
      });
    }
  }

  /** Cálculos derivados */
  const calc = useMemo(() => {
    if (!lmpYmd) return null;

    const lmpDate = toDateFromYMD(lmpYmd);
    const ms = Date.now() - lmpDate.getTime();

    const week = Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24 * 7)) + 1);

    const due = new Date(lmpDate);
    due.setDate(due.getDate() + 280); // 40 semanas

    const daysRemaining = Math.max(
      0,
      Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );

    const trimester = week <= 13 ? 1 : week <= 27 ? 2 : 3;

    return { week, trimester, due, daysRemaining, lmpDate };
  }, [lmpYmd]);

  return { loading, lmpYmd, saveLmpDate, calc };
}
