import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, Smile, Frown, Meh, Zap, Coffee, Pill, Baby } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSave = async () => {
    if (!selectedMood) {
      toast({
        title: "Ops! 🤗",
        description: "Escolha como você está se sentindo hoje",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erro 🚫",
        description: "Você precisa estar logado para salvar entradas",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Save securely to Supabase database instead of localStorage
      const { error } = await supabase
        .from("mood_entries")
        .insert({
          user_id: user.id,
          mood: selectedMood,
          symptoms: selectedSymptoms,
          notes: notes.trim() || null,
          entry_date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Registro salvo! 💕",
        description: "Sua entrada foi adicionada ao diário com segurança"
      });

      // Clear form
      setSelectedMood("");
      setSelectedSymptoms([]);
      setNotes("");
    } catch (error) {
      console.error("Error saving mood entry:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar sua entrada. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
          disabled={isLoading || !user}
          className="w-full bg-gradient-maternal hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isLoading ? "Salvando..." : "Salvar no meu diário 💕"}
        </Button>
        
        {!user && (
          <p className="text-sm text-muted-foreground text-center">
            Faça login para salvar suas entradas com segurança
          </p>
        )}
      </CardContent>
    </Card>
  );
};