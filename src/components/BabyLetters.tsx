import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mail, Heart, Plus, Edit, Trash2, Calendar, Baby } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface BabyLetter {
  id: string;
  title: string;
  content: string;
  week: number;
  date: Date;
  mood: string;
  isPrivate: boolean;
}

const letterTemplates = [
  {
    title: "Primeira carta",
    content: "Meu pequeno amor,\n\nHoje descobri que você existe e meu coração transbordou de alegria! Ainda é tão cedo, mas já posso sentir que nossa vida nunca mais será a mesma...\n\nCom todo meu amor,\nMamãe 💕"
  },
  {
    title: "Primeiro chute",
    content: "Querido bebê,\n\nHoje senti você se mexer pela primeira vez! Foi a sensação mais incrível do mundo. Agora sei que você está aí, crescendo forte e saudável...\n\nMal posso esperar para te conhecer!\nMamãe 👶"
  },
  {
    title: "Carta para o nascimento",
    content: "Meu amor,\n\nO dia está chegando! Em breve você estará em meus braços e poderemos nos olhar nos olhos pela primeira vez. Preparei tanto amor para você...\n\nAté logo, meu pequeno!\nMamãe ❤️"
  }
];

export const BabyLetters = () => {
  const [letters, setLetters] = useState<BabyLetter[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [editingLetter, setEditingLetter] = useState<string | null>(null);
  const [newLetter, setNewLetter] = useState({
    title: '',
    content: '',
    week: '',
    mood: '😊',
    isPrivate: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchLetters();
    }
  }, [user]);

  const fetchLetters = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("baby_letters")
        .select("*")
        .eq("user_id", user.id)
        .order("letter_date", { ascending: false });

      if (error) throw error;

      const formattedLetters: BabyLetter[] = (data || []).map(letter => ({
        id: letter.id,
        title: letter.title,
        content: letter.content,
        week: 0, // baby_letters table doesn't have week field in your schema
        date: new Date(letter.letter_date),
        mood: '😊', // Default since not stored in DB
        isPrivate: letter.is_private || false
      }));

      setLetters(formattedLetters);
    } catch (error) {
      console.error("Error fetching letters:", error);
    }
  };

  const moods = ['😊', '🥰', '😌', '😴', '😢', '😰', '🤗', '✨'];

  const handleSaveLetter = async () => {
    if (!newLetter.title || !newLetter.content) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e o conteúdo da carta",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para salvar cartas",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const letterData = {
        user_id: user.id,
        title: newLetter.title,
        content: newLetter.content,
        is_private: newLetter.isPrivate,
        letter_date: new Date().toISOString().split('T')[0]
      };

      if (editingLetter) {
        const { error } = await supabase
          .from("baby_letters")
          .update(letterData)
          .eq("id", editingLetter)
          .eq("user_id", user.id);

        if (error) throw error;

        toast({
          title: "Carta atualizada! ✉️",
          description: "Suas palavras foram salvas com carinho"
        });
      } else {
        const { error } = await supabase
          .from("baby_letters")
          .insert(letterData);

        if (error) throw error;

        toast({
          title: "Carta enviada ao coração! 💕",
          description: "Uma nova mensagem para seu bebê"
        });
      }

      await fetchLetters();
      setEditingLetter(null);
      setNewLetter({
        title: '',
        content: '',
        week: '',
        mood: '😊',
        isPrivate: true
      });
      setIsWriting(false);
    } catch (error) {
      console.error("Error saving letter:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a carta. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditLetter = (letter: BabyLetter) => {
    setNewLetter({
      title: letter.title,
      content: letter.content,
      week: letter.week.toString(),
      mood: letter.mood,
      isPrivate: letter.isPrivate
    });
    setEditingLetter(letter.id);
    setIsWriting(true);
  };

  const handleDeleteLetter = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("baby_letters")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchLetters();
      toast({
        title: "Carta excluída",
        description: "A carta foi removida"
      });
    } catch (error) {
      console.error("Error deleting letter:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a carta",
        variant: "destructive"
      });
    }
  };

  const handleUseTemplate = (template: any) => {
    setNewLetter({
      ...newLetter,
      title: template.title,
      content: template.content
    });
  };

  const sortedLetters = [...letters].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          Cartas para o Bebê
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Escreva mensagens especiais que seu filho poderá ler no futuro 💕
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Botão de nova carta */}
        {!isWriting && (
          <Button 
            onClick={() => setIsWriting(true)}
            className="w-full bg-gradient-maternal hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Escrever nova carta
          </Button>
        )}

        {/* Formulário de escrita */}
        {isWriting && (
          <Card className="border-primary/20 bg-gradient-soft">
            <CardContent className="p-4 space-y-4">
              {/* Templates */}
              {!editingLetter && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ou use um modelo:</label>
                  <div className="grid grid-cols-1 gap-2">
                    {letterTemplates.map((template, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="outline"
                        onClick={() => handleUseTemplate(template)}
                        className="justify-start text-left h-auto py-2"
                      >
                        <span className="font-medium">{template.title}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título da carta</label>
                  <Input
                    placeholder="Ex: Primeiro encontro"
                    value={newLetter.title}
                    onChange={(e) => setNewLetter({...newLetter, title: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Semana gestacional</label>
                  <Input
                    type="number"
                    placeholder="20"
                    value={newLetter.week}
                    onChange={(e) => setNewLetter({...newLetter, week: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Meu humor hoje</label>
                <div className="flex gap-2">
                  {moods.map(mood => (
                    <Button
                      key={mood}
                      size="sm"
                      variant={newLetter.mood === mood ? 'default' : 'outline'}
                      onClick={() => setNewLetter({...newLetter, mood})}
                    >
                      {mood}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sua mensagem</label>
                <Textarea
                  placeholder="Querido bebê, hoje quero te contar..."
                  value={newLetter.content}
                  onChange={(e) => setNewLetter({...newLetter, content: e.target.value})}
                  className="min-h-[150px] resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="private"
                  checked={newLetter.isPrivate}
                  onChange={(e) => setNewLetter({...newLetter, isPrivate: e.target.checked})}
                />
                <label htmlFor="private" className="text-sm">
                  Carta privada (só eu posso ver)
                </label>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveLetter} 
                  disabled={isLoading || !user}
                  className="flex-1"
                >
                  {isLoading ? "Salvando..." : editingLetter ? 'Atualizar carta' : 'Enviar com amor'} 💕
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsWriting(false);
                    setEditingLetter(null);
                    setNewLetter({
                      title: '',
                      content: '',
                      week: '',
                      mood: '😊',
                      isPrivate: true
                    });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de cartas */}
        {letters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Ainda não há cartas escritas</p>
            <p className="text-xs">Comece criando memórias especiais! ✉️</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Suas cartas ({letters.length})
            </h3>
            
            <div className="space-y-4">
              {sortedLetters.map((letter) => (
                <Card key={letter.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{letter.mood}</span>
                        <div>
                          <h3 className="font-medium">{letter.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{format(letter.date, "dd 'de' MMMM", { locale: ptBR })}</span>
                            {letter.week > 0 && (
                              <>
                                • <Baby className="w-3 h-3" />
                                <span>{letter.week}ª semana</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {letter.isPrivate && (
                          <Badge variant="outline" className="text-xs">
                            Privada
                          </Badge>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => handleEditLetter(letter)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteLetter(letter.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {letter.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};