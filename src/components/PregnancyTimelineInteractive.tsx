import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Calendar, Baby, Heart, Stethoscope, Camera, Gift, Plus, Edit, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  week_number?: number;
  mood_score?: number;
  emotions?: string;
  photo_urls?: string[];
  document_urls?: string[];
  event_type: string;
  is_milestone: boolean;
}

const moodEmojis = ["😔", "😐", "🙂", "😊", "😄"];
const moodLabels = ["Muito triste", "Triste", "Neutro", "Feliz", "Muito feliz"];

export const PregnancyTimelineInteractive = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "Gravidez confirmada! 🎉",
    description: "",
    emotions: "",
    mood_score: [3] as number[],
  });

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: true });

      if (error) throw error;

      // Se não há eventos, criar o primeiro evento
      if (!data || data.length === 0) {
        await createInitialEvent();
      } else {
        setEvents(data);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar timeline",
        description: error.message,
      });
    }
  };

  const createInitialEvent = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .insert([{
          user_id: user.id,
          title: "Gravidez confirmada! 🎉",
          description: "O momento mais especial da minha vida começou hoje...",
          event_date: new Date().toISOString().split('T')[0],
          event_type: 'milestone',
          is_milestone: true,
          mood_score: 5,
          emotions: "Felicidade, ansiedade, amor..."
        }])
        .select();

      if (error) throw error;
      if (data) setEvents(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar evento inicial",
        description: error.message,
      });
    }
  };

  const handleUpdateEvent = async (eventId: string) => {
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('timeline_events')
        .update({
          title: formData.title,
          description: formData.description,
          emotions: formData.emotions,
          mood_score: formData.mood_score[0],
        })
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Evento atualizado! ✨",
        description: "Suas memórias foram salvas com carinho",
      });

      setIsEditing(null);
      fetchEvents();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar evento",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (event: TimelineEvent) => {
    setIsEditing(event.id);
    setFormData({
      title: event.title,
      description: event.description || "",
      emotions: event.emotions || "",
      mood_score: [event.mood_score || 3],
    });
  };

  const getEventIcon = (type: string, isMilestone: boolean) => {
    if (isMilestone) return Baby;
    switch (type) {
      case 'medical': return Stethoscope;
      case 'photo': return Camera;
      case 'shopping': return Gift;
      default: return Heart;
    }
  };

  const getEventColor = (type: string, isMilestone: boolean) => {
    if (isMilestone) return 'bg-maternal-pink text-white';
    switch (type) {
      case 'medical': return 'bg-red-100 text-red-700';
      case 'photo': return 'bg-blue-100 text-blue-700';
      case 'shopping': return 'bg-green-100 text-green-700';
      default: return 'bg-maternal-mint text-white';
    }
  };

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Minha Linha do Tempo
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="relative">
          {/* Linha vertical */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-maternal"></div>
          
          <div className="space-y-6">
            {events.map((event) => {
              const IconComponent = getEventIcon(event.event_type, event.is_milestone);
              
              return (
                <div key={event.id} className="relative flex items-start gap-4">
                  {/* Marcador na linha */}
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${getEventColor(event.event_type, event.is_milestone)}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  
                  {/* Conteúdo do evento */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{event.title}</h3>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        )}
                        
                        {/* Mood Score */}
                        {event.mood_score && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-lg">{moodEmojis[event.mood_score - 1]}</span>
                            <span className="text-sm text-muted-foreground">
                              {moodLabels[event.mood_score - 1]}
                            </span>
                          </div>
                        )}
                        
                        {/* Emotions */}
                        {event.emotions && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">
                              <strong>Sentimentos:</strong> {event.emotions}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(event)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Editar Momento</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="title">Título</Label>
                              <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="description">Descrição</Label>
                              <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Conte como foi este momento especial..."
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="emotions">Sentimentos</Label>
                              <Input
                                id="emotions"
                                value={formData.emotions}
                                onChange={(e) => setFormData({ ...formData, emotions: e.target.value })}
                                placeholder="Felicidade, ansiedade, amor..."
                              />
                            </div>
                            
                            <div>
                              <Label>Como você se sente hoje?</Label>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-2xl">{moodEmojis[formData.mood_score[0] - 1]}</span>
                                <Slider
                                  value={formData.mood_score}
                                  onValueChange={(value) => setFormData({ ...formData, mood_score: value })}
                                  min={1}
                                  max={5}
                                  step={1}
                                  className="flex-1"
                                />
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {moodLabels[formData.mood_score[0] - 1]}
                              </p>
                            </div>
                            
                            <Button 
                              onClick={() => handleUpdateEvent(event.id)}
                              disabled={loading}
                              className="w-full"
                            >
                              {loading ? 'Salvando...' : 'Salvar Momento'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.event_date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};