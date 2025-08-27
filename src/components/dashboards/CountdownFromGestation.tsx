import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useGestation } from "@/hooks/useGestation";

export default function CountdownFromGestation() {
  const { loading, calc } = useGestation();

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

        <div className="text-center">
          <a
            href="#editar-lmp"
            className="text-xs underline text-muted-foreground hover:text-foreground"
          >
            Editar data da menstruação
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
