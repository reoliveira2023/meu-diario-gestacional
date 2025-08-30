import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useGestation } from "@/hooks/useGestation";

// util: Date -> "YYYY-MM-DD"
const toYMD = (d: Date) =>
  [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");

export default function CountdownFromGestation() {
  const { loading, lmpYmd, saveLmpDate, calc } = useGestation();
  const [pending, setPending] = useState<Date | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (lmpYmd) {
      const [y, m, d] = lmpYmd.split("-").map(Number);
      setPending(new Date(y, (m ?? 1) - 1, d ?? 1));
    }
  }, [lmpYmd]);

  async function handleSave() {
    if (!pending) return;
    setSaving(true);
    await saveLmpDate(toYMD(pending));
    setSaving(false);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  }

  if (loading) {
    return (
      <Card className="shadow-card border-0 bg-gradient-soft h-full">
        <CardContent className="p-6 animate-pulse">
          <div className="h-6 w-40 bg-muted rounded mb-4" />
          <div className="h-4 w-24 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const week = calc?.week ?? 0;
  const daysRemaining = calc?.daysRemaining ?? 0;
  const due = calc?.due;

  return (
    <Card className="shadow-card border-0 bg-gradient-soft h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Contagem Regressiva
        </CardTitle>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-white/60">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {pending ? format(pending, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={pending}
                onSelect={(d) => setPending(d ?? undefined)}
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button onClick={handleSave} disabled={!pending || saving || loading} className="bg-pink-600 hover:bg-pink-700">
            {saving ? "Salvando..." : "Salvar"}
          </Button>

          {savedAt && (
            <span className="text-xs text-green-600">Data salva com sucesso.</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Data Provável do Parto</div>
          <div className="text-xl font-semibold">
            {due ? format(due, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "—"}
          </div>
          <div className="text-3xl font-bold mt-2">{daysRemaining}</div>
          <div className="text-xs text-muted-foreground -mt-1">dias restantes</div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso da gestação</span>
            <span>{Math.round((week / 40) * 100)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all"
              style={{ width: `${Math.min((week / 40) * 100, 100)}%` }}
            />
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            {week}s
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
