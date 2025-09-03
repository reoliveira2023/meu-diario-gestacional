// src/components/dashboards/AgendaCard.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

  // Função padrão caso onOpenAgendaModal não seja fornecida
  const handleOpenAgenda = () => {
    if (onOpenAgendaModal) {
      onOpenAgendaModal();
    } else {
      // Implementação padrão - pode ser um modal simples ou navegação
      console.log("Abrindo agenda...");
      alert("Funcionalidade da agenda em desenvolvimento!");
    }
  };

  const handleAddEvent = () => {
    if (onOpenAgendaModal) {
      onOpenAgendaModal();
    } else {
      // Implementação padrão para adicionar evento
      console.log("Adicionando evento para:", date);
      alert(`Adicionar evento para ${date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "data selecionada"}`);
    }
  };

  return (
    <Card
      className={cn(
        "h-full border-0 shadow-[var(--shadow-card)] rounded-2xl overflow-hidden bg-gradient-soft",
        className
      )}
    >
      <CardHeader className="pb-0">
        <div>
          <p className="text-xs text-muted-foreground">Compromissos e eventos</p>
          <CardTitle className="text-foreground">Agenda e Calendário</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Bloco de Próximos eventos - agora ocupa toda a largura */}
        <div className="rounded-xl bg-white/70 backdrop-blur-sm p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Próximos Eventos
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary"
              onClick={handleOpenAgenda}
            >
              Ver Agenda
            </Button>
          </div>

          {/* lista vazia (placeholder) — mantemos altura sem quebrar */}
          <div className="flex-1 rounded-lg border border-border/50 bg-background/50 grid place-items-center text-center p-6">
            <div className="text-sm text-muted-foreground">
              Nenhum evento próximo
              <div className="mt-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      size="sm"
                      className="mt-2"
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Adicionar evento
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <div className="p-4">
                      <div className="mb-3">
                        <span className="text-sm font-medium">Selecione uma data</span>
                      </div>
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        locale={ptBR}
                        className="rounded-md border-0 w-full pointer-events-auto"
                      />
                      <div className="mt-3 pt-3 border-t">
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={handleAddEvent}
                        >
                          Criar evento para {date ? format(date, "dd/MM", { locale: ptBR }) : "data selecionada"}
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
