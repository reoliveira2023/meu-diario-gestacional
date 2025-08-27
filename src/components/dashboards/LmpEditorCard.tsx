import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useGestation } from "@/hooks/useGestation";

// util: Date -> "YYYY-MM-DD"
const toYMD = (d: Date) =>
  [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");

export default function LmpEditorCard() {
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

  const subtitle = useMemo(() => {
    if (!calc) return "Informe a data da sua última menstruação para calcular a semana e a DPP:";
    return `Semana ${calc.week} • DPP: ${format(calc.due!, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
  }, [calc]);

  async function handleSave() {
    if (!pending) return;
    setSaving(true);
    await saveLmpDate(toYMD(pending));
    setSaving(false);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  }

  return (
    <Card id="editar-lmp" className="shadow-card border-0 bg-gradient-soft">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-2">
          🩺 Editar data da menstruação
        </CardTitle>
        <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex flex-wrap items-center gap-3">
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
      </CardContent>
    </Card>
  );
}
