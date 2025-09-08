import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Heart, Mail, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DiaryEntry {
  id: string;
  type: 'mood' | 'letter';
  date: Date;
  title: string;
  content: string;
  mood?: string;
  symptoms?: string[];
  week?: number;
}

export const DiarySearch = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<DiaryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchDiaryEntries();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [entries, searchTerm, dateFilter]);

  const fetchDiaryEntries = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Buscar entradas de humor
      const { data: moodEntries, error: moodError } = await supabase
        .from("mood_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false });

      // Buscar cartas para o bebê
      const { data: babyLetters, error: letterError } = await supabase
        .from("baby_letters")
        .select("*")
        .eq("user_id", user.id)
        .order("letter_date", { ascending: false });

      if (moodError) throw moodError;
      if (letterError) throw letterError;

      // Combinar e formatar entradas
      const allEntries: DiaryEntry[] = [
        ...(moodEntries || []).map(entry => ({
          id: entry.id,
          type: 'mood' as const,
          date: new Date(entry.entry_date),
          title: `Humor: ${entry.mood}`,
          content: entry.notes || "Sem anotações",
          mood: entry.mood,
          symptoms: entry.symptoms || []
        })),
        ...(babyLetters || []).map(letter => ({
          id: letter.id,
          type: 'letter' as const,
          date: new Date(letter.letter_date),
          title: letter.title,
          content: letter.content
        }))
      ];

      // Ordenar por data (mais recente primeiro)
      allEntries.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      setEntries(allEntries);
    } catch (error) {
      console.error("Error fetching diary entries:", error);
      toast({
        title: "Erro ao carregar diário",
        description: "Não foi possível carregar as entradas do diário",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = entries;

    // Filtro por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.title.toLowerCase().includes(term) ||
        entry.content.toLowerCase().includes(term) ||
        (entry.mood && entry.mood.toLowerCase().includes(term))
      );
    }

    // Filtro por data
    if (dateFilter) {
      const filterDate = format(dateFilter, "yyyy-MM-dd");
      filtered = filtered.filter(entry => 
        format(entry.date, "yyyy-MM-dd") === filterDate
      );
    }

    setFilteredEntries(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter(undefined);
    setShowFilters(false);
  };

  const hasActiveFilters = searchTerm || dateFilter;

  if (!user) {
    return (
      <Card className="shadow-card border-0">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Faça login para visualizar seu histórico do diário
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          Buscar no Diário
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Encontre suas memórias e registros de humor
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Barra de busca */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, conteúdo ou humor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(hasActiveFilters && "bg-primary/10")}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                1
              </Badge>
            )}
          </Button>
        </div>

        {/* Filtros expandidos */}
        {showFilters && (
          <Card className="border-primary/20 bg-muted/30">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Filtrar por data</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFilter && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFilter ? format(dateFilter, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>
        )}

        {/* Estatísticas */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredEntries.length} de {entries.length} registros
            {hasActiveFilters && " (filtrados)"}
          </span>
          {entries.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchDiaryEntries}
              disabled={isLoading}
            >
              {isLoading ? "Atualizando..." : "Atualizar"}
            </Button>
          )}
        </div>

        {/* Lista de entradas */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Carregando diário...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
            {entries.length === 0 ? (
              <>
                <p className="text-sm">Seu diário está vazio</p>
                <p className="text-xs">Comece registrando seu humor ou escrevendo uma carta!</p>
              </>
            ) : (
              <>
                <p className="text-sm">Nenhum registro encontrado</p>
                <p className="text-xs">Tente ajustar os filtros de busca</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <Card key={`${entry.type}-${entry.id}`} className={cn(
                "border-l-4 transition-all hover:shadow-md",
                entry.type === 'mood' ? "border-l-primary" : "border-l-secondary"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {entry.type === 'mood' ? (
                        <Heart className="w-4 h-4 text-primary" />
                      ) : (
                        <Mail className="w-4 h-4 text-secondary" />
                      )}
                      <div>
                        <h3 className="font-medium">{entry.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{format(entry.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Badge variant="outline" className="text-xs">
                      {entry.type === 'mood' ? 'Humor' : 'Carta'}
                    </Badge>
                  </div>

                  {/* Sintomas (só para entradas de humor) */}
                  {entry.type === 'mood' && entry.symptoms && entry.symptoms.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {entry.symptoms.map((symptom, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {entry.content.length > 200 
                        ? `${entry.content.substring(0, 200)}...` 
                        : entry.content
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};