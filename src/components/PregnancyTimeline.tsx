import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Baby, Heart, Stethoscope, Camera, Gift } from "lucide-react";

interface TimelineEvent {
  id: string;
  date: string;
  week: number;
  title: string;
  description: string;
  type: 'medical' | 'milestone' | 'photo' | 'shopping' | 'personal';
  completed?: boolean;
}

const mockEvents: TimelineEvent[] = [
  {
    id: '1',
    date: '2024-01-15',
    week: 8,
    title: 'Primeira consulta pré-natal',
    description: 'Confirmação da gravidez e primeiros exames',
    type: 'medical',
    completed: true
  },
  {
    id: '2',
    date: '2024-02-10',
    week: 12,
    title: 'Primeiro ultrassom',
    description: 'Primeira foto do bebê! 👶',
    type: 'milestone',
    completed: true
  },
  {
    id: '3',
    date: '2024-03-05',
    week: 16,
    title: 'Descobrimos o sexo!',
    description: 'É uma menina! 💕',
    type: 'milestone',
    completed: true
  },
  {
    id: '4',
    date: '2024-03-20',
    week: 18,
    title: 'Primeiros chutes',
    description: 'Senti os primeiros movimentos da bebê',
    type: 'personal',
    completed: true
  },
  {
    id: '5',
    date: '2024-04-15',
    week: 22,
    title: 'Ultrassom morfológico',
    description: 'Exame detalhado - tudo perfeito!',
    type: 'medical',
    completed: false
  },
  {
    id: '6',
    date: '2024-05-10',
    week: 26,
    title: 'Chá de bebê',
    description: 'Celebração com familiares e amigos',
    type: 'personal',
    completed: false
  }
];

const typeConfig = {
  medical: { icon: Stethoscope, color: 'bg-red-100 text-red-700', label: 'Médico' },
  milestone: { icon: Baby, color: 'bg-maternal-pink/20 text-maternal-pink', label: 'Marco' },
  photo: { icon: Camera, color: 'bg-blue-100 text-blue-700', label: 'Foto' },
  shopping: { icon: Gift, color: 'bg-green-100 text-green-700', label: 'Compras' },
  personal: { icon: Heart, color: 'bg-maternal-mint/20 text-maternal-mint', label: 'Pessoal' }
};

export const PregnancyTimeline = () => {
  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Linha do Tempo da Gestação
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="relative">
          {/* Linha vertical */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-maternal"></div>
          
          <div className="space-y-6">
            {mockEvents.map((event, index) => {
              const config = typeConfig[event.type];
              
              return (
                <div key={event.id} className="relative flex items-start gap-4">
                  {/* Marcador na linha */}
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                    event.completed ? 'bg-primary' : 'bg-muted border-2 border-primary'
                  }`}>
                    <config.icon className={`w-4 h-4 ${
                      event.completed ? 'text-white' : 'text-primary'
                    }`} />
                  </div>
                  
                  {/* Conteúdo do evento */}
                  <div className={`flex-1 pb-6 ${event.completed ? '' : 'opacity-60'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className={`font-medium ${event.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {event.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant="outline" className={config.color}>
                          {config.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {event.week}ª sem
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleDateString('pt-BR', {
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