// src/components/dashboards/NewDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Baby, Calendar, Clock, Bell, Images } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useGestation } from "@/hooks/useGestation";

// util: Date -> "YYYY-MM-DD" (sem fuso)
function toYMD(d: Date) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function NewDashboard() {
  const { loading, lmpYmd, saveLmpDate, calc } = useGestation();

  // controle do popover de edição
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(lmpYmd ? new Date(lmpYmd) : undefined);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // abrir direto se a URL vier com #editar-lmp
  useEffect(() => {
    if (window.location.hash === "#editar-lmp") {
      setOpen(true);
      // limpa o hash para não reabrir depois
      history.replaceState(null, "", " ");
    }
  }, []);

  // mantém o tempDate sincronizado quando carregar do banco
  useEffect(() => {
    if (lmpYmd) {
      setTempDate(new Date(lmpYmd));
    }
  }, [lmpYmd]);

  // derivados para exibição
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* CARD GRANDE: Gestação */}
      <Card className="lg:col-span-2 border-0 shadow-[var(--shadow-card)] bg-gradient-soft">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Baby className="w-5 h-5 text-primary" />
            Semana Gestacional
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Cabeçalho da semana / DPP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/70 p-4 text-center">
              <div className="text-3xl font-bold text-primary">{week || "—"}ª semana</div>
              <div className="text-sm text-muted-foreground">{trimester}</div>
            </div>

            <div className="rounded-2xl bg-white/70 p-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">Data Provável do Parto</div>
              <div className="text-lg font-semibold">
                {due ? format(due, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "—"}
              </div>
            </div>

            <div className="rounded-2xl bg-white/70 p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Dias restantes
                </span>
                <span className="text-lg font-semibold text-primary">{daysRemaining}</span>
              </div>

              <div className="mt-4 space-y-2">
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
              </div>
            </div>
          </div>

          {/* Ação: editar LMP */}
          <div className="flex flex-wrap items-center gap-3">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-white" data-testid="btn-editar-lmp">
                  <Calendar className="w-4 h-4 mr-2" />
                  {lmpYmd
                    ? `Editar data da menstruação (${format(
                        new Date(lmpYmd),
                        "dd/MM/yyyy",
                        { locale: ptBR }
                      )})`
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
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setOpen(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {justSaved && (
              <span className="text-xs text-green-600">✅ Data salva com sucesso!</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CARD: Lembretes do dia (resumo) */}
      <Card className="border-0 shadow-[var(--shadow-card)]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Lembretes de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Organize seus lembretes do dia sem sair desta tela.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                // abre a aba "home", caso você use Tabs por hash, ajuste aqui
                const el = document.querySelector('[data-tab="home"]') as HTMLButtonElement | null;
                el?.click();
                // rolar até sua seção de lembretes, se houver um id
                const section = document.getElementById("lembretes");
                section?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Abrir Lembretes
            </Button>
            <Button
              onClick={() => {
                const addBtn = document.querySelector(
                  '[data-testid="add-reminder"]'
                ) as HTMLButtonElement | null;
                addBtn?.click();
              }}
            >
              + Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CARD: Galeria (resumo) */}
      <Card className="lg:col-span-1 border-0 shadow-[var(--shadow-card)]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Images className="w-5 h-5 text-primary" />
            Galeria de Momentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Veja e adicione fotos dos momentos especiais.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                // abra a aba de Fotos; ajuste conforme seu Tabs
                const el = document.querySelector('[data-tab="photos"]') as HTMLButtonElement | null;
                el?.click();
              }}
            >
              Abrir Galeria
            </Button>
            <Button
              onClick={() => {
                const uploadBtn = document.querySelector(
                  '[data-testid="upload-photo"]'
                ) as HTMLButtonElement | null;
                uploadBtn?.click();
              }}
            >
              + Enviar foto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
