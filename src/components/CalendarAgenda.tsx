import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Clock, Heart, Camera, Scale, Stethoscope, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, addWeeks, addMonths, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  user_id: string;
  event_type: string;
  title: string;
  description?: string;
  event_date: string;
  scheduled_time: string;
  is_recurring: boolean;
  recurring_type?: 'daily' | 'weekly' | 'monthly';
  recurring_end_date?: string;
  created_at: string;
}

const eventTypes = [
  { value: "mood", label: "Humor", icon: Heart, color: "bg-primary/20 text-primary border-primary/30" },
  { value: "weight", label: "Peso", icon: Scale, color: "bg-secondary/20 text-secondary border-secondary/30" },
  { value: "photo", label: "Foto", icon: Camera, color: "bg-accent/20 text-accent border-accent/30" },
  { value: "medical", label: "Médico", icon: Stethoscope, color: "bg-maternal-blue/20 text-maternal-blue border-maternal-blue/30" },
  { value: "appointment", label: "Consulta", icon: CalendarIcon, color: "bg-pink-500/20 text-pink-600 border-pink-500/30" }
];

interface CalendarAgendaProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CalendarAgenda = ({ open, onOpenChange }: CalendarAgendaProps) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({
    event_type: "appointment",
    title: "",
    description: "",
    event_date: format(new Date(), "yyyy-MM-dd"),
    scheduled_time: "09:00",
    is_recurring: false,
    recurring_type: 'weekly' as 'daily' | 'weekly' | 'monthly',
    recurring_end_date: format(addMonths(new Date(), 3), "yyyy-MM-dd")
  });

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const startDate = startOfMonth(new Date());
      const endDate = endOfMonth(addMonths(new Date(), 2));

      const { data, error } = await supabase
        .from("daily_reminders")
        .select("*")
        .eq("user_id", user.id)
        .gte("reminder_date", format(startDate, "yyyy-MM-dd"))
        .lte("reminder_date", format(endDate, "yyyy-MM-dd"))
        .order("reminder_date")
        .order("scheduled_time");

      if (error) throw error;

      // Map daily_reminders to CalendarEvent format
      const mappedEvents: CalendarEvent[] = (data || []).map(reminder => ({
        id: reminder.id,
        user_id: reminder.user_id,
        event_type: reminder.reminder_type || 'appointment',
        title: reminder.title,
        description: reminder.description,
        event_date: reminder.reminder_date || format(new Date(), "yyyy-MM-dd"),
        scheduled_time: reminder.scheduled_time,
        is_recurring: false,
        created_at: reminder.created_at
      }));

      setEvents(mappedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async () => {
    if (!user || !newEvent.title.trim()) return;

    try {
      // Create single event in daily_reminders table
      const { error } = await supabase
        .from("daily_reminders")
        .insert({
          user_id: user.id,
          title: newEvent.title,
          description: newEvent.description,
          reminder_date: newEvent.event_date,
          scheduled_time: newEvent.scheduled_time,
          reminder_type: newEvent.event_type,
          is_completed: false
        });

      if (error) throw error;

      await fetchEvents();
      setNewEvent({
        event_type: "appointment",
        title: "",
        description: "",
        event_date: format(new Date(), "yyyy-MM-dd"),
        scheduled_time: "09:00",
        is_recurring: false,
        recurring_type: 'weekly',
        recurring_end_date: format(addMonths(new Date(), 3), "yyyy-MM-dd")
      });
      setShowAddDialog(false);
      toast.success("Evento criado!");
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Erro ao criar evento");
    }
  };

  const generateRecurringEvents = () => {
    const events = [];
    const startDate = new Date(newEvent.event_date);
    const endDate = new Date(newEvent.recurring_end_date);
    
    let currentDate = startDate;
    
    while (currentDate <= endDate) {
      events.push({
        user_id: user!.id,
        event_type: newEvent.event_type,
        title: newEvent.title,
        description: newEvent.description,
        event_date: format(currentDate, "yyyy-MM-dd"),
        scheduled_time: newEvent.scheduled_time,
        is_recurring: true,
        recurring_type: newEvent.recurring_type,
        recurring_end_date: newEvent.recurring_end_date
      });

      // Calculate next occurrence
      switch (newEvent.recurring_type) {
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
      }
    }
    
    return events;
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from("daily_reminders")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setEvents(prev => prev.filter(e => e.id !== id));
      toast.success("Evento removido!");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Erro ao remover evento");
    }
  };

  const getTypeInfo = (type: string) => {
    return eventTypes.find(t => t.value === type) || eventTypes[4];
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.event_date), date));
  };

  const upcomingEvents = events
    .filter(event => new Date(event.event_date) >= new Date())
    .slice(0, 5);

  return (
    <div className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Agenda e Calendário</h2>
        <p className="text-muted-foreground">
          Gerencie seus eventos e compromissos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Calendário</h3>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Evento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Evento</DialogTitle>
                    <DialogDescription>
                      Adicione um evento ao seu calendário
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="event_type">Tipo</Label>
                      <Select
                        value={newEvent.event_type}
                        onValueChange={(value) => setNewEvent(prev => ({ ...prev, event_type: value }))}
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
                      <Label htmlFor="event_title">Título</Label>
                      <Input
                        id="event_title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Ex: Consulta médica"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="event_description">Descrição (opcional)</Label>
                      <Textarea
                        id="event_description"
                        value={newEvent.description}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Detalhes sobre o evento..."
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="event_date">Data</Label>
                        <Input
                          id="event_date"
                          type="date"
                          value={newEvent.event_date}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, event_date: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="event_time">Horário</Label>
                        <Input
                          id="event_time"
                          type="time"
                          value={newEvent.scheduled_time}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, scheduled_time: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_recurring"
                          checked={newEvent.is_recurring}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, is_recurring: e.target.checked }))}
                          className="rounded"
                        />
                        <Label htmlFor="is_recurring" className="text-sm font-medium">
                          Evento recorrente
                        </Label>
                        <RefreshCw className="w-4 h-4 text-muted-foreground" />
                      </div>

                      {newEvent.is_recurring && (
                        <div className="space-y-3 p-3 bg-muted/20 rounded-lg">
                          <div className="space-y-2">
                            <Label htmlFor="recurring_type">Frequência</Label>
                            <Select
                              value={newEvent.recurring_type}
                              onValueChange={(value) => setNewEvent(prev => ({ ...prev, recurring_type: value as 'daily' | 'weekly' | 'monthly' }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Diário</SelectItem>
                                <SelectItem value="weekly">Semanal</SelectItem>
                                <SelectItem value="monthly">Mensal</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="recurring_end_date">Data limite</Label>
                            <Input
                              id="recurring_end_date"
                              type="date"
                              value={newEvent.recurring_end_date}
                              onChange={(e) => setNewEvent(prev => ({ ...prev, recurring_end_date: e.target.value }))}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <Button onClick={createEvent} className="w-full">
                      Criar Evento
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className={cn("w-full border rounded-md p-3 pointer-events-auto")}
              modifiers={{
                hasEvent: (date) => getEventsForDate(date).length > 0
              }}
              modifiersStyles={{
                hasEvent: {
                  backgroundColor: 'hsl(var(--primary) / 0.1)',
                  color: 'hsl(var(--primary))',
                  fontWeight: 'bold'
                }
              }}
            />

            {selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Eventos - {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getEventsForDate(selectedDate).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum evento para esta data</p>
                  ) : (
                    <div className="space-y-2">
                      {getEventsForDate(selectedDate).map(event => {
                        const typeInfo = getTypeInfo(event.event_type);
                        const Icon = typeInfo.icon;
                        
                        return (
                          <div key={event.id} className="flex items-start gap-2 p-2 rounded border">
                            <Badge variant="outline" className={cn("text-xs", typeInfo.color)}>
                              <Icon className="w-3 h-3 mr-1" />
                              {typeInfo.label}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{event.title}</span>
                                {event.is_recurring && (
                                  <RefreshCw className="w-3 h-3 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {event.scheduled_time.slice(0, 5)}
                              </div>
                              {event.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {event.description}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteEvent(event.id)}
                              className="text-muted-foreground hover:text-destructive h-auto p-1"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Upcoming Events Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Próximos Eventos</h3>
            
            <Card>
              <CardContent className="p-4">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum evento próximo</p>
                    <p className="text-sm">Adicione eventos ao seu calendário</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map(event => {
                      const typeInfo = getTypeInfo(event.event_type);
                      const Icon = typeInfo.icon;
                      
                      return (
                        <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
                          <Badge variant="outline" className={typeInfo.color}>
                            <Icon className="w-3 h-3 mr-1" />
                            {typeInfo.label}
                          </Badge>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{event.title}</h4>
                              {event.is_recurring && (
                                <RefreshCw className="w-3 h-3 text-muted-foreground" />
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" />
                                {format(new Date(event.event_date), "dd/MM/yyyy")}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {event.scheduled_time.slice(0, 5)}
                              </div>
                            </div>
                            
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {event.description}
                              </p>
                            )}
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteEvent(event.id)}
                            className="text-muted-foreground hover:text-destructive h-auto p-1"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };