import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Baby, Heart } from "lucide-react";
import { differenceInDays, differenceInHours, differenceInMinutes, addWeeks, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useGestation } from "@/hooks/useGestation"; // <-- usa o hook que persiste no Supabase

export const CountdownTimer = () => {
  const { loading, lmpDate, saveLmpDate, calc } = useGestation(); // lmp = última menstruação
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // calcula DPP a partir da LMP (persistida)
  const calculatedDueDate = lmpDate ? addWeeks(lmpDate, 40) : null;

  useEffect(() => {
    if (!calculatedDueDate) return;
    const now = currentDate;
    const days = Math.max(0, differenceInDays(calculatedDueDate, now));
    const hours = Math.max(0, differenceInHours(calculatedDueDate, now) % 24);
    const minutes = Math.max(0, differenceInMinutes(calculatedDueDate, now) % 60);
    setTimeLeft({ days, hours, minutes });
  }, [calculatedDueDate, currentDate]);

  // Sem LMP: mostra seletor e salva no Supabase (persistente pós-logout)
  if (!lmpDate) {
    return (
      <Card className="shadow-card border-0 bg-gradient-soft">
        <CardContent className="p-4 text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-3">
            Para calcular sua semana, informe a data da sua última menstruação:
          </p>
          <input
            type="date"
            className="border rounded px-3 py-2"
            onChange={(e) => {
              if (!e.target.value) return;
              // salva YYYY-MM-DD no Supabase (o hook já faz o update)
              const d = new Date(e.target.value);
              saveLmpDate(d);
            }}
          />
        </CardContent>
      </Card>
    );
  }

  const isOverdue = calculatedDueDate! < currentDate;
  const totalWeeks = calc?.week ?? 0;
  const daysFromLmp = lmpDate ? differenceInDays(currentDate, lmpDate) : 0;
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
        {/* Data prevista */}
        <div className="text-center">
          <p className="text-sm opacity-90 mb-1">Data Provável do Parto</p>
          <p className="text-lg font-bold">
            {format(calculatedDueDate!, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Contagem regressiva */}
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

        {/* Progresso da gestação */}
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

        {/* Mensagens motivacionais */}
        <div className="text-center text-sm opacity-90">
          {timeLeft.days > 60 && "Ainda temos muito tempo para nos preparar! 💕"}
          {timeLeft.days <= 60 && timeLeft.days > 30 && "O encontro está se aproximando! 🤗"}
          {timeLeft.days <= 30 && timeLeft.days > 14 && "Nas últimas semanas! Em breve nos braços 👶"}
          {timeLeft.days <= 14 && timeLeft.days > 7 && "Últimos dias! A ansiedade está no máximo! ✨"}
          {timeLeft.days <= 7 && timeLeft.days > 0 && "A qualquer momento agora! 🎉"}
          {isOverdue && "Paciência, pequeno! Você chegará na hora certa 🙏"}
        </div>
      </CardContent>
    </Card>
  );
};
