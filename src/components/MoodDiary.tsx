import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, Smile, Frown, Meh, Zap, Coffee, Pill, Baby } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const moodOptions = [
  { emoji: "😊", label: "Radiante", color: "bg-maternal-peach text-maternal-peach" },
  { emoji: "😌", label: "Tranquila", color: "bg-maternal-mint text-maternal-mint" },
  { emoji: "😴", label: "Cansada", color: "bg-maternal-lavender text-maternal-lavender" },
  { emoji: "😰", label: "Ansiosa", color: "bg-yellow-100 text-yellow-700" },
  { emoji: "😢", label: "Sensível", color: "bg-blue-100 text-blue-700" },
  { emoji: "🤗", label: "Amorosa", color: "bg-pink-100 text-pink-700" }
];

const symptomOptions = [
  { icon: Coffee, label: "Enjoo", color: "text-orange-600" },
  { icon: Zap, label: "Energia baixa", color: "text-yellow-600" },
  { icon: Pill, label: "Dor de cabeça", color: "text-red-600" },
  { icon: Baby, label: "Movimentos do bebê", color: "text-maternal-pink" },
  { icon: Heart, label: "Azia", color: "text-orange-500" }
];

export const MoodDiary = () => {
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSave = () => {
    if (!selectedMood) {
      toast({
        title: "Ops! 🤗",
        description: "Escolha como você está se sentindo hoje",
        variant: "destructive"
      });
      return;
    }

    // Salvar no localStorage ou backend
    const entry = {
      date: new Date().toISOString(),
      mood: selectedMood,
      symptoms: selectedSymptoms,
      notes
    };
    
    const existingEntries = JSON.parse(localStorage.getItem('moodEntries') || '[]');
    existingEntries.push(entry);
    localStorage.setItem('moodEntries', JSON.stringify(existingEntries));

    toast({
      title: "Registro salvo! 💕",
      description: "Sua entrada foi adicionada ao diário"
    });

    // Limpar formulário
    setSelectedMood("");
    setSelectedSymptoms([]);
    setNotes("");
  };

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary" />
          Como você está hoje?
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Seleção de humor */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Meu humor hoje:</h3>
          <div className="grid grid-cols-3 gap-3">
            {moodOptions.map((mood) => (
              <Button
                key={mood.label}
                variant={selectedMood === mood.label ? "default" : "outline"}
                className={`flex flex-col gap-1 h-auto py-3 transition-all ${
                  selectedMood === mood.label ? 'ring-2 ring-primary/50' : ''
                }`}
                onClick={() => setSelectedMood(mood.label)}
              >
                <span className="text-2xl">{mood.emoji}</span>
                <span className="text-xs">{mood.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Sintomas */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Sintomas que senti:</h3>
          <div className="flex flex-wrap gap-2">
            {symptomOptions.map((symptom) => (
              <Badge
                key={symptom.label}
                variant={selectedSymptoms.includes(symptom.label) ? "default" : "outline"}
                className={`cursor-pointer flex items-center gap-1 py-2 px-3 transition-all ${
                  selectedSymptoms.includes(symptom.label) ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                }`}
                onClick={() => handleSymptomToggle(symptom.label)}
              >
                <symptom.icon className="w-3 h-3" />
                {symptom.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Anotações */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Pensamentos do dia:</h3>
          <Textarea
            placeholder="Como foi seu dia? O que você sentiu? Algum momento especial? ✨"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px] resize-none"
          />
        </div>

        {/* Botão salvar */}
        <Button 
          onClick={handleSave}
          className="w-full bg-gradient-maternal hover:opacity-90 transition-opacity"
        >
          Salvar no meu diário 💕
        </Button>
      </CardContent>
    </Card>
  );
};