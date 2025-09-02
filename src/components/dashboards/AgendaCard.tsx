// src/components/dashboards/AgendaCard.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, Trash2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarAgenda } from "@/components/CalendarAgenda"; // named import

type Reminder = {
  id: string;
  user_id: string;
  reminder_type: string;
  title: string;
  description?: string;
  scheduled_time: string; // "HH:mm"
  is_completed: boolean;
  reminder_date: string; // "YYYY-MM-DD"
};

const TYPE_STYLE: Record<string, { label: string; className: string }> = {
  mood: { label: "Humor", className: "bg-primary/20 text-primary" },
  weight: { label: "Peso", className: "bg-secondary/20 text-secondary" },
  photo: { label: "Foto", className: "bg-accent/20 text-accent" },
  medical: { label: "Médico", className: "bg-maternal-blue/20 text-maternal-blue" },
  general: { label: "Geral", className: "bg-muted/20 text-muted-foreground" },
};

export default function AgendaCard() {
  const { user } = useAuth();

  const [upcoming, setUpcoming] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcoming();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadUpcoming() {
    if (!user) return;

    try {
      setLoading(true);
      const today = format(new Date(), "yyyy-MM-dd");
      const until = format(addDays(new Date(), 7), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("daily_reminders")
        .select("*")
        .eq("user_id", user.id)
        .gte("reminder_date", today)
        .lte("reminder_date", until)
        .order("reminder_date", { ascending: true })
        .order("scheduled_time", { ascending: true });

      if (error) throw error;
      setUpcoming(data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function toggleDone(id: string, current: boolean) {
    const { error } = await supabase
      .from("daily_reminders")
      .update({ is_completed: !current })
      .eq("id", id);

    if (!error) {
      setUpcoming((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_completed: !current } : r))
      );
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("daily_reminders").delete().eq("id", id);
    if (!error) {
      setUpcoming((prev) => prev.filter((r) => r.id !== id));
    }
  }

  function fmt(dateYmd: string, time?: string) {
    try {
      const [y, m, d] = dateYmd.split("-").map(Number);
      const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
      const base = format(dt, "EEE, dd 'de' MMM", { locale: ptBR });
      return time ? `${base} • ${time.slice(0, 5)}` : base;
    } catch {
      return dateYmd;
    }
  }

  return (
    <Card className="border-0 shadow-card bg-gradient-card rounded-card overflow-hidden hover:shadow-floating transition-all duration-500">
      <CardHeader className="pb-6 bg-gradient-to-br from-baby-blue/30 via-mint-green/20 to-soft-lavender/30">
        <CardTitle className="flex items-center gap-3 text-lg font-[var(--font-heading)]">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-primary font-semibold">Sua Agenda</div>
            <div className="text-xs text-muted-foreground font-normal">Compromissos e eventos</div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-8 p-8">
        {/* Calendário inline com visual suave */}
        <div className="rounded-3xl bg-gradient-to-br from-white/80 via-baby-blue/10 to-mint-green/10 backdrop-blur-sm p-6 border border-white/20 shadow-soft">
          <CalendarAgenda />
        </div>

        {/* Próximos 7 dias com estética delicada */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-maternal-pink"></div>
            <div className="font-semibold text-primary">Próximos Eventos</div>
            <div className="text-xs text-muted-foreground">(7 dias)</div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-12 rounded-3xl bg-gradient-to-br from-white/60 via-maternal-pink/10 to-baby-blue/10 border border-white/30">
              <CalendarIcon className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <div className="font-medium text-muted-foreground mb-2">Tudo tranquilo por aqui</div>
              <div className="text-sm text-muted-foreground">Nenhum evento próximo. Adicione eventos quando precisar.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map((r) => {
                const type = TYPE_STYLE[r.reminder_type] ?? TYPE_STYLE.general;
                return (
                  <div
                    key={r.id}
                    className={`group flex items-start gap-4 p-6 rounded-3xl border-0 shadow-soft transition-all duration-300 ${
                      r.is_completed 
                        ? "bg-gradient-to-r from-muted/20 to-muted/30 opacity-75" 
                        : "bg-gradient-to-r from-white via-maternal-pink/5 to-baby-blue/5 hover:shadow-card hover:scale-[1.02]"
                    }`}
                  >
                    <Checkbox
                      checked={r.is_completed}
                      onCheckedChange={() => toggleDone(r.id, r.is_completed)}
                      className="mt-2 rounded-lg"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge 
                          variant="outline" 
                          className={`${type.className} rounded-xl px-3 py-1 font-medium border-0`}
                        >
                          {type.label}
                        </Badge>
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/20 px-3 py-1 rounded-xl">
                          <Clock className="w-3 h-3" />
                          {fmt(r.reminder_date, r.scheduled_time)}
                        </div>
                      </div>

                      <h4 className={`font-semibold text-primary mb-1 ${r.is_completed ? "line-through opacity-75" : ""}`}>
                        {r.title}
                      </h4>
                      {r.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{r.description}</p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(r.id)}
                      className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-300"
                      aria-label="Remover evento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
