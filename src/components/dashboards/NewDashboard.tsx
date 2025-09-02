// src/components/dashboards/NewDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Baby, Calendar, Images, Camera } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useGestation } from "@/hooks/useGestation";

// 👇 troque RemindersCard por AgendaCard
import AgendaCard from "./AgendaCard";

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      {/* ESQUERDA: Gestação - Card principal aconchegante */}
      <Card className="lg:col-span-1 border-0 shadow-card bg-gradient-card backdrop-blur-sm rounded-card overflow-hidden group hover:shadow-floating transition-all duration-500">
        <CardHeader className="pb-6 bg-gradient-to-br from-maternal-pink/30 via-soft-lavender/20 to-baby-blue/30">
          <CardTitle className="flex items-center gap-3 text-lg font-[var(--font-heading)]">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Baby className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-primary font-semibold">Sua Gestação</div>
              <div className="text-xs text-muted-foreground font-normal">Acompanhe cada momento</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 p-8">
          <div className="rounded-3xl bg-gradient-to-br from-white/80 via-maternal-pink/10 to-baby-blue/10 backdrop-blur-sm p-8 border border-white/20 shadow-soft">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold bg-gradient-to-r from-primary via-maternal-pink to-soft-lavender bg-clip-text text-transparent mb-2">
                {week || "—"}ª
              </div>
              <div className="text-lg font-medium text-primary mb-1">semana</div>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-maternal-pink to-soft-lavender text-sm font-medium text-white shadow-soft">
                {trimester}
              </div>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">Data Provável do Parto</div>
                <div className="text-xl font-bold text-primary">
                  {due ? format(due, "dd 'de' MMMM", { locale: ptBR }) : "—"}
                </div>
                {due && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {format(due, "yyyy", { locale: ptBR })}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Progresso da gestação</span>
                  <span className="text-sm font-bold text-primary">{progressPct}%</span>
                </div>
                <div className="relative">
                  <div className="w-full h-4 bg-gradient-to-r from-muted/30 to-muted/50 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-maternal-pink via-primary to-soft-lavender transition-all duration-700 ease-out rounded-full shadow-soft"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </div>
                <div className="text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {daysRemaining} dias restantes ✨
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full bg-gradient-to-r from-white via-maternal-pink/10 to-white border-maternal-pink/30 hover:border-primary/50 rounded-2xl py-6 shadow-soft hover:shadow-card transition-all duration-300" 
                  data-testid="btn-editar-lmp"
                >
                  <Calendar className="w-5 h-5 mr-3 text-primary" />
                  <div className="text-left">
                    <div className="font-medium text-primary">
                      {lmpYmd ? "Editar data da DUM" : "Definir data da DUM"}
                    </div>
                    {lmpYmd && (
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(lmpYmd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </div>
                    )}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-6 rounded-3xl border-0 shadow-floating bg-gradient-card backdrop-blur-lg" align="start">
                <div className="text-base font-semibold mb-4 text-primary">Selecione a data da última menstruação</div>
                <CalendarComponent
                  mode="single"
                  selected={tempDate}
                  onSelect={(d) => setTempDate(d || undefined)}
                  disabled={(d) => d > new Date()}
                  initialFocus
                  className="rounded-2xl"
                />
                <div className="mt-6 flex gap-3">
                  <Button 
                    size="sm" 
                    onClick={handleSave} 
                    disabled={!tempDate || saving}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-primary to-maternal-pink hover:from-primary/90 hover:to-maternal-pink/90 shadow-soft"
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setOpen(false)} 
                    disabled={saving}
                    className="rounded-2xl hover:bg-muted/50"
                  >
                    Cancelar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            {justSaved && (
              <div className="text-center p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200">
                <span className="text-sm font-medium text-emerald-700">✨ Data salva com carinho!</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MEIO: Agenda com design mais suave */}
      <div className="lg:col-span-1">
        <AgendaCard />
      </div>

      {/* DIREITA: Galeria com estética polaroid */}
      <Card className="lg:col-span-1 border-0 shadow-card bg-gradient-card rounded-card overflow-hidden hover:shadow-floating transition-all duration-500">
        <CardHeader className="pb-6 bg-gradient-to-br from-mint-green/30 via-baby-blue/20 to-soft-lavender/30">
          <CardTitle className="flex items-center gap-3 text-lg font-[var(--font-heading)]">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Images className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-primary font-semibold">Galeria de Momentos</div>
              <div className="text-xs text-muted-foreground font-normal">Suas memórias especiais</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Placeholders para fotos em formato polaroid */}
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i}
                  className="aspect-square rounded-3xl bg-gradient-to-br from-white via-maternal-pink/10 to-baby-blue/10 border-2 border-white shadow-polaroid p-3 hover:shadow-floating transition-all duration-500 cursor-pointer group"
                >
                  <div className="w-full h-4/5 bg-gradient-to-br from-muted/20 to-muted/40 rounded-2xl mb-2 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <Camera className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <div className="text-xs text-center text-muted-foreground font-medium">Momento {i}</div>
                </div>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              className="w-full rounded-2xl py-6 bg-gradient-to-r from-white via-mint-green/10 to-white border-mint-green/30 hover:border-primary/50 shadow-soft hover:shadow-card transition-all duration-300"
            >
              <Images className="w-5 h-5 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-medium text-primary">Ver toda a galeria</div>
                <div className="text-xs text-muted-foreground">Seus momentos especiais</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}