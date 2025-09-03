// src/components/dashboards/AgendaCard.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Card da Agenda para o topo do dashboard.
 * Principais cuidados:
 * - NADA de largura fixa; tudo é w-full / flex / grid responsivo
 * - Envelopado com overflow-hidden e rounded-2xl para não “sangrar” sombra/border
 * - Altura fluida com min-h para manter equilíbrio visual
 */

type Props = {
  className?: string;
  onOpenAgendaModal?: () => void; // se quiser abrir seu modal/Agenda completa
};

export default function AgendaCard({ className, onOpenAgendaModal }: Props) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <Card
      className={cn(
        "h-full border-0 shadow-[var(--shadow-card)] rounded-2xl overflow-hidden bg-gradient-soft",
        className
      )}
    >
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Compromissos e eventos</p>
            <CardTitle className="text-foreground">Agenda e Calendário</CardTitle>
          </div>

          <Button
            size="sm"
            variant="secondary"
            className="whitespace-nowrap"
            onClick={onOpenAgendaModal}
            data-testid="btn-novo-evento"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Novo Evento
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* grid que NUNCA estoura: duas colunas no md+ e uma no mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {/* Bloco do Calendário */}
          <div className="rounded-xl bg-white/70 backdrop-blur-sm p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Calendário</span>
              <span className="text-xs text-muted-foreground">
                {date ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }) : "\u00A0"}
              </span>
            </div>

            {/* Calendar do shadcn é flexível; coloque SEM largura fixa */}
            <div className="w-full">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={ptBR}
                className="rounded-md border-0 w-full"
              />
            </div>

            <div className="mt-4 rounded-lg bg-muted/40 p-3">
              <div className="text-sm font-medium mb-1">
                Eventos – {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : ""}
              </div>
              <p className="text-sm text-muted-foreground">
                Nenhum evento para esta data
              </p>
            </div>
          </div>

          {/* Bloco de Próximos eventos */}
          <div className="rounded-xl bg-white/70 backdrop-blur-sm p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                Próximos Eventos
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
                onClick={onOpenAgendaModal}
              >
                Ver Agenda
              </Button>
            </div>

            {/* lista vazia (placeholder) — mantemos altura sem quebrar */}
            <div className="flex-1 rounded-lg border border-border/50 bg-background/50 grid place-items-center text-center p-6">
              <div className="text-sm text-muted-foreground">
                Nenhum evento próximo
                <div className="mt-1">
                  <Button
                    size="sm"
                    onClick={onOpenAgendaModal}
                    className="mt-2"
                  >
                    Adicionar evento
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
