// src/components/.../CountdownTimer.tsx
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Baby, Heart } from "lucide-react";
import { differenceInDays, differenceInHours, differenceInMinutes, addWeeks, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useGestation } from "@/hooks/useGestation";

export const CountdownTimer = () => {
  const { loading, lmpYmd, saveLmpDate, calc } = useGestation();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editing, setEditing] = useState(!lmpYmd);
  const [pending, setPending] = useState(lmpYmd ?? ""); // YYYY-MM-DD

  useEffect(() => {
    const t = setInterval(() => setCurrentDate(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // se mudou no banco (outro lugar), sincroniza no input
  useEffect(() => {
    if (lmpYmd) { setPending(lmpYmd); setEditing(false); }
  }, [lmpYmd]);

  // calcula DPP
  const calculatedDueDate = calc?.lmpDate ? addWeeks(calc.lmpDate, 40) : null;

  useEffect(() => {
    if (!calculatedDueDate) return;
    const now = currentDate;
    const days = Math.max(0, differenceInDays(calculatedDueDate, now));
    const hours = Math.max(0, differenceInHours(calculatedDueDate, now) % 24);
    const minutes = Math.max(0, differenceInMinutes(calculatedDueDate, now) % 60);
    setTimeLeft({ days, hours, minutes });
  }, [calculatedDueDate, currentDate]);

  // Modo edição (sem data salva ou usuário clicou "Editar")
  if (loading || editing || !lmpYmd) {
    return (
      <Card className="shadow-card border-0 bg-gradient-soft">
        <CardContent className="p-4 text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-3">
            Informe a data da sua última menstruação para calcular a semana e a DPP:
          </p>
          <div className="flex items-center justify-center gap-2">
            <input
              type="date"
              value={pending}
              onChange={(e)=> setPending(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <button
              className="px-3 py-2 rounded bg-pink-600 text-white hover:bg-pink-700"
              onClick={async () => {
                if (!pending) return;
                await saveLmpDate(pending); // salva como YYYY-MM-DD (persistente)
                setEditing(false);
              }}
            >
              Salvar
            </button>
            {lmpYmd && (
              <button
                className="px-3 py-2 rounded border"
                onClick={()=> { setPending(lmpYmd); setEditing(false); }}
              >
                Cancelar
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isOverdue = calculatedDueDate! < currentDate;
  const totalWeeks = calc?.week ?? 0;
  const daysFromLmp = calc?.lmpDate ? differenceInDays(currentDate, calc.lmpDate) : 0;
  const daysInCurrentWeek = daysFromLmp % 7;

  return (
    <Card className="shadow-card border-0 bg-gradient-maternal text-white">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-white">
          <Baby className="w-5 h-5" />
          {isOverdue ? "Bem-vindo(a) ao mundo!" : "Contagem Regressiva"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm opacity-90 mb-1">Data Provável do Parto</p>
          <p className="text-lg font-bold">
            {format(calculatedDueDate!, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {!isOverdue ? (
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-2xl font-bold">{timeLeft.days}</p>
              <p className="text-sm opacity-90">
                {timeLeft.days === 1 ? "dia restante" : "dias restantes"}
              </p>
            </div>
            {timeLeft.days <= 30 && (
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-lg font-bold">{timeLeft.hours}</p>
                  <p className="text-xs opacity-90">horas</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-lg font-bold">{timeLeft.minutes}</p>
                  <p className="text-xs opacity-90">minutos</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-2">
            <Heart className="w-8 h-8 mx-auto mb-2" />
            <p className="text-lg font-bold">Seu bebê já deveria estar aqui!</p>
            <p className="text-sm opacity-90">
              {Math.abs(differenceInDays(calculatedDueDate!, currentDate))}{" "}
              {Math.abs(differenceInDays(calculatedDueDate!, currentDate)) === 1 ? " dia" : " dias"} após a DPP
            </p>
          </div>
        )}

        {totalWeeks > 0 && !isOverdue && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm opacity-90">
              <span>Progresso da gestação</span>
              <span>{totalWeeks}s {daysInCurrentWeek}d</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totalWeeks / 40) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="text-center">
          <button className="text-sm underline" onClick={() => setEditing(true)}>
            Editar data da menstruação
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
