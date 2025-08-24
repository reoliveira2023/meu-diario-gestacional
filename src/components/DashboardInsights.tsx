import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Camera, Users, Calendar, CheckCircle, Bell } from "lucide-react";
import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InsightData {
  todayReminders: number;
  completedReminders: number;
  weekPhotos: number;
  familyMembers: number;
  moodStreak: number;
  nextAppointment?: string;
}

export const DashboardInsights = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<InsightData>({
    todayReminders: 0,
    completedReminders: 0,
    weekPhotos: 0,
    familyMembers: 0,
    moodStreak: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInsights();
    }
  }, [user]);

  const fetchInsights = async () => {
    if (!user) return;

    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      // Buscar lembretes de hoje
      const { data: reminders } = await supabase
        .from("daily_reminders")
        .select("*")
        .eq("user_id", user.id)
        .eq("reminder_date", today);

      // Buscar fotos da semana
      const { data: photos } = await supabase
        .from("photos")
        .select("*")
        .eq("user_id", user.id)
        .gte("taken_date", format(weekStart, "yyyy-MM-dd"));

      // Buscar membros da família
      const { data: family } = await supabase
        .from("family_members")
        .select("*")
        .eq("user_id", user.id);

      // Buscar próxima consulta
      const { data: nextExam } = await supabase
        .from("medical_records")
        .select("*")
        .eq("user_id", user.id)
        .gte("appointment_date", today)
        .order("appointment_date", { ascending: true })
        .limit(1);

      // Calcular sequência de humor (últimos 7 dias com registro)
      const { data: moods } = await supabase
        .from("mood_entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("entry_date", format(weekStart, "yyyy-MM-dd"))
        .order("entry_date", { ascending: false });

      setInsights({
        todayReminders: reminders?.length || 0,
        completedReminders: reminders?.filter(r => r.is_completed).length || 0,
        weekPhotos: photos?.length || 0,
        familyMembers: family?.length || 0,
        moodStreak: moods?.length || 0,
        nextAppointment: nextExam?.[0]?.appointment_date
      });
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const insightCards = [
    {
      title: "Lembretes Hoje",
      value: `${insights.completedReminders}/${insights.todayReminders}`,
      description: "Concluídos",
      icon: Bell,
      color: "text-primary",
      progress: insights.todayReminders > 0 ? (insights.completedReminders / insights.todayReminders) * 100 : 0
    },
    {
      title: "Fotos Esta Semana",
      value: insights.weekPhotos.toString(),
      description: "Momentos capturados",
      icon: Camera,
      color: "text-accent"
    },
    {
      title: "Família Conectada",
      value: insights.familyMembers.toString(),
      description: "Pessoas acompanhando",
      icon: Users,
      color: "text-secondary"
    },
    {
      title: "Registros Semanais",
      value: insights.moodStreak.toString(),
      description: "Dias registrados",
      icon: Heart,
      color: "text-maternal-pink"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cards de insights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {insightCards.map((card, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    {card.title}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </div>
                <card.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${card.color}`} />
              </div>
              
              {card.progress !== undefined && (
                <div className="mt-3">
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${card.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Próxima consulta */}
      {insights.nextAppointment && (
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Próxima Consulta</h4>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(insights.nextAppointment), "dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
              {isToday(new Date(insights.nextAppointment)) && (
                <Badge variant="secondary" className="ml-auto">
                  Hoje!
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progresso do dia */}
      {insights.todayReminders > 0 && insights.completedReminders === insights.todayReminders && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:from-green-950 dark:to-emerald-950 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200">
                  Parabéns! 🎉
                </h4>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Você completou todos os lembretes de hoje!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};