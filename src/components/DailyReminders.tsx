import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// ⚠️ Use default import do seu componente de Agenda
// Se no seu projeto for export nomeado, troque para:  import { CalendarAgenda } from "@/components/CalendarAgenda";
import CalendarAgenda from "@/components/CalendarAgenda";

interface DailyReminder {
  id: string;
  user_id: string;
  reminder_type: string;
  title: string;
  description?: string;
  scheduled_time: string; // "HH:mm" (string)
  is_completed: boolean;
  reminder_date: string;  // "YYYY-MM-DD"
}

const TYPE_MAP: Record<
  string,
  { label: string; className: string }
> = {
  mood: { label: "Humor", className: "bg-primary/20 text-primary" },
  weight: { label: "Peso", className: "bg-secondary/20 text-secondary" },
  photo: { label: "Foto", className: "bg-accent/20 text-accent" },
  medical: { label: "Médico", className: "bg-maternal-blue/20 text-maternal-blue" },
  general: { label: "Geral", className: "bg-muted/20 text-muted-foreground" },
};

export const DailyReminders = () => {
  const { user } = useAuth();

  // Vamos exibir "Próximos eventos" com base na tabela daily_reminders pelos próximos 7 dias.
  const [upcoming, setUpcoming] = useState<DailyReminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcoming();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchUpcoming() {
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
    } catch (err) {
      console.error("[DailyReminders] fetchUpcoming error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleReminderComplete(id: string, current: boolean) {
    try {
      const { error } = await supabase
        .from("daily_reminders")
        .update({ is_completed: !current })
        .eq("id", id);

      if (error) throw error;

      setUpcoming((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_completed: !current } : r))
      );
    } catch (error) {
      console.error("[DailyReminders] toggleReminderComplete error:", error);
      toast.error("Erro ao atualizar evento");
    }
  }

  async function deleteReminder(id: string) {
    try {
      const { error } = await supabase.from("daily_reminders").delete().eq("id", id);
      if (error) throw error;

      setUpcoming((prev) => prev.filter((r) => r.id !== id));
      toast.success("Evento removido!");
    } catch (error) {
      console.error("[DailyReminders] deleteReminder error:", error);
      toast.error("Erro ao remover evento");
    }
  }

  // 🔁 Formatação para exibir data + hora
  function formatHumanDate(dateYmd: string, time?: string) {
    try {
      const [year, month, day] = dateYmd.split("-").map(Number);
      const d = new Date(year, (month ?? 1) - 1, day ?? 1);
      const base = format(d, "EEE, dd 'de' MMM", { locale: ptBR });
      return time ? `${base} • ${time.slice(0, 5)}` : base;
    } catch {
      return dateYmd;
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Agenda
            </CardTitle>
            <CardDescription>
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </CardDescription>
          </div>

          {/* Se seu CalendarAgenda abrir em modal via trigger, você pode colocar um botão aqui:
          <Button size="sm" onClick={() => setShowCalendarAgenda(true)}>
            Abrir Calendário
          </Button>
          */}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Calendário/Agenda no lugar dos lembretes */}
        <div>
          {/* Renderização inline do calendário/agenda */}
          <CalendarAgenda />
        </div>

        {/* Próximos eventos (7 dias) */}
        <div>
          <div className="text-sm font-medium mb-2">Próximos eventos (7 dias)</div>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : upcoming.length === 0 ? (
            // ✅ Removido o estado vazio com ícone de sino — nada de "Nenhum lembrete" aqui.
            <div className="text-sm text-muted-foreground">
              Sem eventos agendados nos próximos dias.
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((r) => {
                const type = TYPE_MAP[r.reminder_type] ?? TYPE_MAP.general;
                return (
                  <div
                    key={r.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                      r.is_completed ? "bg-muted/30 opacity-75" : "bg-background hover:bg-muted/20"
                    }`}
                  >
                    <Checkbox
                      checked={r.is_completed}
                      onCheckedChange={() => toggleReminderComplete(r.id, r.is_completed)}
                      className="mt-1"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={type.className}>
                          {type.label}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatHumanDate(r.reminder_date, r.scheduled_time)}
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
                      onClick={() => deleteReminder(r.id)}
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
};

export default DailyReminders;
