import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Baby, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useGestation } from "@/hooks/useGestation";

// util: transforma Date -> "YYYY-MM-DD" sem fuso
const toYMD = (d: Date) =>
  [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");

export const PregnancyWeekCalculator = () => {
  const { loading, lmpYmd, saveLmpDate, calc } = useGestation(); // <-- lê/salva no Supabase
  const [editing, setEditing] = useState<boolean>(!lmpYmd);
  const [pendingYmd, setPendingYmd] = useState<string>(lmpYmd ?? "");
  const [saved, setSaved] = useState(false);

  // quando carregar do banco, sincroniza estados locais
  useEffect(() => {
    if (lmpYmd) {
      setPendingYmd(lmpYmd);
      setEditing(false);
    }
  }, [lmpYmd]);

  // Selecionar no calendário
  const selectedDate = pendingYmd ? new Date(pendingYmd) : undefined;

  // salvar no Supabase
  async function handleSave() {
    if (!pendingYmd) return;
    await saveLmpDate(pendingYmd);
    setSaved(true);
    setEditing(false);
  }

  // UI de edição (sem data ou ao clicar "Editar")
  if (loading || editing || !lmpYmd) {
    return (
      <Card className="shadow-card border-0 bg-gradient-soft">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Baby className="w-5 h-5 text-primary" />
            Semana Gestacional
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Para calcular sua semana gestacional, informe a data da sua última menstruação:
          </p>

          <div className="flex items-center justify-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-white/50">
                  <Calendar className="w-4 h-4 mr-2" />
                  {selectedDate
                    ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                    : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setPendingYmd(toYMD(d))}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              className="bg-pink-600 hover:bg-pink-700 text-white"
              disabled={!pendingYmd}
              onClick={handleSave}
            >
              Salvar
            </Button>
          </div>

          {saved && (
            <p className="text-xs text-green-600">Data salva! Pode sair e voltar que continuará aqui.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Dados calculados (já com LMP salva)
  const week = calc?.week ?? 0;
  const due = calc?.due;
  const daysRemaining = calc?.daysRemaining ?? 0;

  const getWeekMessage = (w: number) => (w <= 12 ? "1º Trimestre 🌱" : w <= 28 ? "2º Trimestre 🌸" : "3º Trimestre 🌺");

  return (
    <Card className="shadow-card border-0 bg-gradient-soft">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Baby className="w-5 h-5 text-primary" />
          Semana Gestacional
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Semana atual */}
        <div className="text-center bg-white/50 rounded-2xl p-6">
          <div className="text-3xl font-bold text-primary mb-2">{week}ª semana</div>
          <div className="text-sm text-muted-foreground mb-1">{getWeekMessage(week)}</div>
          <div className="text-xs text-muted-foreground">
            Data provável do parto: {due && format(due, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </div>
        </div>

        {/* Contagem regressiva */}
        <div className="flex items-center justify-between bg-maternal-blue/20 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-maternal-blue" />
            <span className="text-sm font-medium">Dias restantes</span>
          </div>
          <span className="text-lg font-bold text-maternal-blue">{Math.max(0, daysRemaining)}</span>
        </div>

        {/* Barra de progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso</span>
            <span>{Math.round((week / 40) * 100)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-gradient-maternal h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((week / 40) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="text-center">
          <Button variant="ghost" className="text-sm underline" onClick={() => { setEditing(true); setSaved(false); }}>
            Editar data da menstruação
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
