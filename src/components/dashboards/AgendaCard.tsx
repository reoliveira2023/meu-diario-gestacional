// src/components/dashboards/AgendaCard.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Clock, Heart, Camera, Scale, Stethoscope } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const eventTypes = [
  { value: "appointment", label: "Consulta", icon: Stethoscope, color: "bg-maternal-blue/20 text-maternal-blue border-maternal-blue/30" },
  { value: "exam", label: "Exame", icon: Heart, color: "bg-primary/20 text-primary border-primary/30" },
  { value: "medical", label: "Médico", icon: CalendarIcon, color: "bg-pink-500/20 text-pink-600 border-pink-500/30" },
  { value: "weight", label: "Peso", icon: Scale, color: "bg-secondary/20 text-secondary border-secondary/30" },
  { value: "photo", label: "Foto", icon: Camera, color: "bg-accent/20 text-accent border-accent/30" }
];

interface Event {
  id: string;
  title: string;
  description?: string;
  reminder_date: string;
  scheduled_time: string;
  reminder_type: string;
}

type Props = {
  className?: string;
  onOpenAgendaModal?: () => void;
};

export default function AgendaCard({ className }: Props) {
  const { user } = useAuth();
  const [showEventDialog, setShowEventDialog] = React.useState(false);
  const [events, setEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [newEvent, setNewEvent] = React.useState({
    type: "appointment",
    title: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00",
    location: ""
  });

  React.useEffect(() => {
    if (user) {
      fetchUpcomingEvents();
    }
  }, [user]);

  const fetchUpcomingEvents = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("daily_reminders")
        .select("*")
        .eq("user_id", user.id)
        .gte("reminder_date", format(new Date(), "yyyy-MM-dd"))
        .order("reminder_date")
        .order("scheduled_time")
        .limit(3);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async () => {
    if (!user || !newEvent.title.trim()) return;

    try {
      const { error } = await supabase
        .from("daily_reminders")
        .insert({
          user_id: user.id,
          title: newEvent.title,
          description: newEvent.description,
          reminder_date: newEvent.date,
          scheduled_time: newEvent.time,
          reminder_type: newEvent.type,
          is_completed: false
        });

      if (error) throw error;

      await fetchUpcomingEvents();
      setNewEvent({
        type: "appointment",
        title: "",
        description: "",
        date: format(new Date(), "yyyy-MM-dd"),
        time: "09:00",
        location: ""
      });
      setShowEventDialog(false);
      toast.success("Evento criado com sucesso!");
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Erro ao criar evento");
    }
  };

  const handleAddEvent = () => {
    setShowEventDialog(true);
  };

  const getTypeInfo = (type: string) => {
    return eventTypes.find(t => t.value === type) || eventTypes[0];
  };

  return (
    <>
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
                onClick={handleAddEvent}
              >
                <CalendarIcon className="w-4 h-4 mr-1" />
                Novo
              </Button>
            </div>

            {/* Lista de eventos ou placeholder */}
            <div className="flex-1 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : events.length === 0 ? (
                <div className="flex-1 rounded-lg border border-border/50 bg-background/50 grid place-items-center text-center p-6">
                  <div className="text-sm text-muted-foreground">
                    Nenhum evento próximo
                    <div className="mt-2">
                      <Button
                        size="sm"
                        onClick={handleAddEvent}
                      >
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Adicionar evento
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                events.map((event) => {
                  const typeInfo = getTypeInfo(event.reminder_type);
                  const Icon = typeInfo.icon;
                  
                  return (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                      <div className={cn("p-1.5 rounded-lg", typeInfo.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{event.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(event.reminder_date), "dd/MM", { locale: ptBR })} às {event.scheduled_time.slice(0, 5)}
                        </div>
                        {event.description && (
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            {event.description}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Dialog para criar evento */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exames e Consultas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event_type">Tipo</Label>
              <Select
                value={newEvent.type}
                onValueChange={(value) => setNewEvent(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_title">Nome da Consulta</Label>
              <Input
                id="event_title"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Consulta de rotina"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_date">Data</Label>
              <Input
                id="event_date"
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_time">Horário</Label>
              <Input
                id="event_time"
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_location">Local</Label>
              <Input
                id="event_location"
                value={newEvent.location}
                onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Hospital/Clínica"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_description">Observações</Label>
              <Textarea
                id="event_description"
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Observações sobre a consulta/exame..."
                rows={3}
              />
            </div>

            <Button onClick={createEvent} className="w-full" disabled={!newEvent.title.trim()}>
              Criar evento para {format(new Date(newEvent.date), "dd/MM", { locale: ptBR })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}