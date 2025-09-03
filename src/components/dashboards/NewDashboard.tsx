// src/components/dashboards/NewDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Baby, Calendar, Clock, Images } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useGestation } from "@/hooks/useGestation";
import AgendaCard from "@/components/dashboards/AgendaCard";

function toYMD(d: Date) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function NewDashboard() {
  const { loading, lmpYmd, saveLmpDate, calc } = useGestation();
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(lmpYmd ? new Date(lmpYmd) : undefined);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (window.location.hash === "#editar-lmp") {
      setOpen(true);
      history.replaceState(null, "", " ");
    }
  }, []);

  useEffect(() => {
    if (lmpYmd) setTempDate(new Date(lmpYmd));
  }, [lmpYmd]);

  const week = calc?.week ?? 0;
  const due = calc?.due;
  const daysRemaining = Math.max(0, calc?.daysRemaining ?? 0);
  const progressPct = useMemo(() => Math.min(Math.round((week / 40) * 100), 100), [week]);
  const trimester =
    week <= 13 ? "1º Trimestre 🌱" : week <= 28 ? "2º Trimestre 🌸" : "3º Trimestre 🌺";

  async function handleSave() {
    if (!tempDate) return;
    try {
      setSaving(true);
      await saveLmpDate(toYMD(tempDate));
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* ESQUERDA: Gestação */}
      <Card className="lg:col-span-1 border-0 shadow-[var(--shadow-card)] bg-gradient-soft rounded-2xl">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Baby className="w-5 h-5 text-primary" />
            Semana Gestacional
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className="rounded-2xl bg-white/70 p-5 backdrop-blur-sm">
            <div className="text-3xl font-bold text-primary">{week || "—"}ª semana</div>
            <div className="text-sm text-muted-foreground">{trimester}</div>

            <div className="mt-4">
              <div className="text-xs text-muted-foreground mb-1">Data Provável do Parto</div>
              <div className="text-lg font-semibold">
                {due ? format(due, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "—"}
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso da gestação</span>
                <span>{progressPct}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-2 bg-gradient-to-r from-pink-400 via-pink-500 to-purple-400 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {daysRemaining} dias restantes
              </div>
            </div>

            <div className="mt-5">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="bg-white" data-testid="btn-editar-lmp">
                    <Calendar className="w-4 h-4 mr-2" />
                    {lmpYmd
                      ? `Editar data (${format(new Date(lmpYmd), "dd/MM/yyyy", { locale: ptBR })})`
                      : "Definir data da última menstruação"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <div className="text-sm font-medium mb-2">Selecione a data</div>
                  <CalendarComponent
                    mode="single"
                    selected={tempDate}
                    onSelect={(d) => setTempDate(d || undefined)}
                    disabled={(d) => d > new Date()}
                    initialFocus
                  />
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={!tempDate || saving}>
                      {saving ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
                      Cancelar
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              {justSaved && (
                <span className="ml-2 text-xs text-green-600">✅ Data salva com sucesso!</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MEIO: Agenda (sem lembretes) */}
      <div className="lg:col-span-1">
        <AgendaCard />
      </div>

      {/* DIREITA: Galeria (header limpo + espaço para thumbs/ações) */}
      <Card className="lg:col-span-1 border-0 shadow-[var(--shadow-card)] rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Images className="w-5 h-5 text-primary" />
            Galeria de Momentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Guarde seus momentos mais especiais durante a gestação 💕
          </p>
          {/* Dica: se quiser, renderize aqui 3–4 thumbnails recentes como preview */}
        </CardContent>
      </Card>
    </div>
  );
}
