import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Baby, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, differenceInWeeks, addWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";

export const PregnancyWeekCalculator = () => {
  const [lastPeriod, setLastPeriod] = useState<Date>();
  const [currentWeek, setCurrentWeek] = useState<number>(0);
  const [dueDate, setDueDate] = useState<Date>();
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  useEffect(() => {
    if (lastPeriod) {
      const today = new Date();
      const weeks = differenceInWeeks(today, lastPeriod);
      const calculatedDueDate = addWeeks(lastPeriod, 40);
      const remaining = Math.ceil((calculatedDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      setCurrentWeek(weeks);
      setDueDate(calculatedDueDate);
      setDaysRemaining(remaining);
    }
  }, [lastPeriod]);

  const getWeekMessage = (week: number) => {
    if (week <= 12) return "1º Trimestre 🌱";
    if (week <= 28) return "2º Trimestre 🌸";
    return "3º Trimestre 🌺";
  };

  return (
    <Card className="shadow-card border-0 bg-gradient-soft">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Baby className="w-5 h-5 text-primary" />
          Semana Gestacional
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!lastPeriod ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              Para calcular sua semana gestacional, informe a data da sua última menstruação:
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-white/50">
                  <Calendar className="w-4 h-4 mr-2" />
                  Selecionar data
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={lastPeriod}
                  onSelect={setLastPeriod}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Semana atual */}
            <div className="text-center bg-white/50 rounded-2xl p-6">
              <div className="text-3xl font-bold text-primary mb-2">
                {currentWeek}ª semana
              </div>
              <div className="text-sm text-muted-foreground mb-1">
                {getWeekMessage(currentWeek)}
              </div>
              <div className="text-xs text-muted-foreground">
                Data provável do parto: {dueDate && format(dueDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            </div>

            {/* Contagem regressiva */}
            <div className="flex items-center justify-between bg-maternal-blue/20 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-maternal-blue" />
                <span className="text-sm font-medium">Dias restantes</span>
              </div>
              <span className="text-lg font-bold text-maternal-blue">
                {daysRemaining > 0 ? daysRemaining : 0}
              </span>
            </div>

            {/* Barra de progresso visual */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso</span>
                <span>{Math.round((currentWeek / 40) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-maternal h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((currentWeek / 40) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};