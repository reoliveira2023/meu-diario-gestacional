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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Agenda e Calendário
        </CardTitle>
        <CardDescription>Gerencie seus eventos e compromissos</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Calendário inline */}
        <div>
          <CalendarAgenda />
        </div>

        {/* Próximos 7 dias */}
        <div>
          <div className="text-sm font-medium mb-2">Próximos Eventos (7 dias)</div>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Nenhum evento próximo. Adicione eventos no seu calendário.
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((r) => {
                const type = TYPE_STYLE[r.reminder_type] ?? TYPE_STYLE.general;
                return (
                  <div
                    key={r.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                      r.is_completed ? "bg-muted/30 opacity-75" : "bg-background hover:bg-muted/20"
                    }`}
                  >
                    <Checkbox
                      checked={r.is_completed}
                      onCheckedChange={() => toggleDone(r.id, r.is_completed)}
                      className="mt-1"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={type.className}>
                          {type.label}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {fmt(r.reminder_date, r.scheduled_time)}
                        </div>
                      </div>

                      <h4 className={`font-medium ${r.is_completed ? "line-through" : ""}`}>
                        {r.title}
                      </h4>
                      {r.description && (
                        <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(r.id)}
                      className="text-muted-foreground hover:text-destructive"
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
