import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, Plus, CheckCircle, Clock, Heart, Camera, Scale, Stethoscope, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DailyReminder {
  id: string;
  user_id: string;
  reminder_type: string;
  title: string;
  description?: string;
  scheduled_time: string;
  is_completed: boolean;
  reminder_date: string;
}

const reminderTypes = [
  { value: "mood", label: "Humor", icon: Heart, color: "bg-primary/20 text-primary" },
  { value: "weight", label: "Peso", icon: Scale, color: "bg-secondary/20 text-secondary" },
  { value: "photo", label: "Foto", icon: Camera, color: "bg-accent/20 text-accent" },
  { value: "medical", label: "Médico", icon: Stethoscope, color: "bg-maternal-blue/20 text-maternal-blue" },
  { value: "general", label: "Geral", icon: Bell, color: "bg-muted/20 text-muted-foreground" }
];

export const DailyReminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<DailyReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newReminder, setNewReminder] = useState({
    reminder_type: "general",
    title: "",
    description: "",
    scheduled_time: "09:00"
  });

  useEffect(() => {
    fetchTodayReminders();
  }, [user]);

  const fetchTodayReminders = async () => {
    if (!user) return;

    try {
      const today = format(new Date(), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("daily_reminders")
        .select("*")
        .eq("user_id", user.id)
        .eq("reminder_date", today)
        .order("scheduled_time");

      if (error) throw error;

      setReminders(data || []);
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  const createReminder = async () => {
    if (!user || !newReminder.title.trim()) return;

    try {
      const { data, error } = await supabase
        .from("daily_reminders")
        .insert({
          user_id: user.id,
          ...newReminder,
          reminder_date: format(new Date(), "yyyy-MM-dd")
        })
        .select()
        .single();

      if (error) throw error;

      setReminders(prev => [...prev, data]);
      setNewReminder({
        reminder_type: "general",
        title: "",
        description: "",
        scheduled_time: "09:00"
      });
      setShowAddDialog(false);
      toast.success("Lembrete criado!");
    } catch (error) {
      console.error("Error creating reminder:", error);
      toast.error("Erro ao criar lembrete");
    }
  };

  const toggleReminderComplete = async (id: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from("daily_reminders")
        .update({ is_completed: !isCompleted })
        .eq("id", id);

      if (error) throw error;

      setReminders(prev => 
        prev.map(r => 
          r.id === id ? { ...r, is_completed: !isCompleted } : r
        )
      );
    } catch (error) {
      console.error("Error updating reminder:", error);
      toast.error("Erro ao atualizar lembrete");
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from("daily_reminders")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setReminders(prev => prev.filter(r => r.id !== id));
      toast.success("Lembrete removido!");
    } catch (error) {
      console.error("Error deleting reminder:", error);
      toast.error("Erro ao remover lembrete");
    }
  };

  const getTypeInfo = (type: string) => {
    return reminderTypes.find(t => t.value === type) || reminderTypes[4];
  };

  const completedCount = reminders.filter(r => r.is_completed).length;
  const progressPercentage = reminders.length > 0 ? (completedCount / reminders.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Lembretes de Hoje
            </CardTitle>
            <CardDescription>
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Lembrete</DialogTitle>
                <DialogDescription>
                  Adicione um lembrete para não esquecer de registrar suas informações
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={newReminder.reminder_type}
                    onValueChange={(value) => setNewReminder(prev => ({ ...prev, reminder_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {reminderTypes.map(type => (
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
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Registrar humor matinal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    value={newReminder.description}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detalhes sobre o lembrete..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Horário</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newReminder.scheduled_time}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, scheduled_time: e.target.value }))}
                  />
                </div>

                <Button onClick={createReminder} className="w-full">
                  Criar Lembrete
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Progresso do dia */}
        {reminders.length > 0 && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso do Dia</span>
              <span className="text-sm text-muted-foreground">
                {completedCount}/{reminders.length}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            {progressPercentage === 100 && (
              <p className="text-sm text-primary font-medium mt-2 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Parabéns! Todos os lembretes concluídos! 🎉
              </p>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {reminders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum lembrete para hoje</p>
            <p className="text-sm">Adicione lembretes para organizar seu dia</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map(reminder => {
              const typeInfo = getTypeInfo(reminder.reminder_type);
              const Icon = typeInfo.icon;
              
              return (
                <div 
                  key={reminder.id} 
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    reminder.is_completed 
                      ? 'bg-muted/30 opacity-60' 
                      : 'bg-background hover:bg-muted/20'
                  }`}
                >
                  <Checkbox
                    checked={reminder.is_completed}
                    onCheckedChange={() => toggleReminderComplete(reminder.id, reminder.is_completed)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={typeInfo.color}>
                        <Icon className="w-3 h-3 mr-1" />
                        {typeInfo.label}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {reminder.scheduled_time.slice(0, 5)}
                      </div>
                    </div>
                    
                    <h4 className={`font-medium ${reminder.is_completed ? 'line-through' : ''}`}>
                      {reminder.title}
                    </h4>
                    
                    {reminder.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {reminder.description}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteReminder(reminder.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};