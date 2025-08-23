import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Heart, Baby, Star, Plus, Trash2, Search, Shuffle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BabyName {
  id: string;
  name: string;
  gender: 'boy' | 'girl' | 'unisex';
  origin: string;
  meaning: string;
  isFavorite: boolean;
  notes?: string;
}

const popularNames = {
  boy: [
    { name: "Miguel", origin: "Hebraico", meaning: "Quem é como Deus" },
    { name: "Arthur", origin: "Celta", meaning: "Urso forte" },
    { name: "Gael", origin: "Celta", meaning: "Belo e generoso" },
    { name: "Theo", origin: "Grego", meaning: "Deus" },
    { name: "Heitor", origin: "Grego", meaning: "Aquele que guarda" },
    { name: "Ravi", origin: "Sânscrito", meaning: "Sol" },
    { name: "Davi", origin: "Hebraico", meaning: "Amado" },
    { name: "Bernardo", origin: "Germânico", meaning: "Forte como um urso" }
  ],
  girl: [
    { name: "Helena", origin: "Grego", meaning: "Tocha, luz" },
    { name: "Alice", origin: "Germânico", meaning: "De qualidade nobre" },
    { name: "Laura", origin: "Latino", meaning: "Loureiro" },
    { name: "Maria Eduarda", origin: "Hebraico/Germânico", meaning: "Senhora soberana + guardiã das riquezas" },
    { name: "Cecília", origin: "Latino", meaning: "Cega" },
    { name: "Eloá", origin: "Hebraico", meaning: "Deus" },
    { name: "Manuela", origin: "Hebraico", meaning: "Deus está conosco" },
    { name: "Antonella", origin: "Latino", meaning: "Valiosa, de valor inestimável" }
  ],
  unisex: [
    { name: "Alex", origin: "Grego", meaning: "Protetor" },
    { name: "Angel", origin: "Grego", meaning: "Mensageiro" },
    { name: "Ariel", origin: "Hebraico", meaning: "Leão de Deus" },
    { name: "Jordan", origin: "Hebraico", meaning: "Descer, fluir" }
  ]
};

export const BabyNamesGenerator = () => {
  const [savedNames, setSavedNames] = useState<BabyName[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGender, setSelectedGender] = useState<'boy' | 'girl' | 'unisex' | 'all'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { toast } = useToast();

  const generateRandomNames = () => {
    const allNames = [...popularNames.boy, ...popularNames.girl, ...popularNames.unisex];
    const randomNames = allNames.sort(() => Math.random() - 0.5).slice(0, 6);
    
    return randomNames.map(name => ({
      ...name,
      gender: popularNames.boy.includes(name) ? 'boy' as const : 
              popularNames.girl.includes(name) ? 'girl' as const : 'unisex' as const
    }));
  };

  const [suggestedNames, setSuggestedNames] = useState(generateRandomNames());

  const handleSaveName = (nameData: any) => {
    const newName: BabyName = {
      id: Date.now().toString(),
      name: nameData.name,
      gender: nameData.gender,
      origin: nameData.origin,
      meaning: nameData.meaning,
      isFavorite: false,
      notes: ''
    };

    setSavedNames(prev => [...prev, newName]);
    toast({
      title: "Nome salvo! 💕",
      description: `${nameData.name} foi adicionado à sua lista`
    });
  };

  const handleToggleFavorite = (id: string) => {
    setSavedNames(prev => prev.map(name => 
      name.id === id ? { ...name, isFavorite: !name.isFavorite } : name
    ));
  };

  const handleDeleteName = (id: string) => {
    setSavedNames(prev => prev.filter(name => name.id !== id));
  };

  const filteredNames = savedNames.filter(name => {
    const matchesSearch = name.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = selectedGender === 'all' || name.gender === selectedGender;
    const matchesFavorite = !showFavoritesOnly || name.isFavorite;
    
    return matchesSearch && matchesGender && matchesFavorite;
  });

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'boy': return 'bg-blue-100 text-blue-700';
      case 'girl': return 'bg-pink-100 text-pink-700';
      case 'unisex': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'boy': return 'Menino';
      case 'girl': return 'Menina';
      case 'unisex': return 'Unissex';
      default: return '';
    }
  };

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Baby className="w-5 h-5 text-primary" />
          Nomes para o Bebê
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Sugestões */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Sugestões populares:</h3>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setSuggestedNames(generateRandomNames())}
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Novo mix
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {suggestedNames.map((name, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gradient-soft rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{name.name}</span>
                    <Badge variant="outline" className={getGenderColor(name.gender)}>
                      {getGenderLabel(name.gender)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>Origin:</strong> {name.origin} • <strong>Significado:</strong> {name.meaning}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSaveName(name)}
                  disabled={savedNames.some(saved => saved.name === name.name)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Filtros para nomes salvos */}
        {savedNames.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Minha lista de nomes:</h3>
            
            {/* Barra de busca e filtros */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar nomes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={selectedGender === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedGender('all')}
                >
                  Todos
                </Button>
                <Button
                  size="sm"
                  variant={selectedGender === 'boy' ? 'default' : 'outline'}
                  onClick={() => setSelectedGender('boy')}
                >
                  Menino
                </Button>
                <Button
                  size="sm"
                  variant={selectedGender === 'girl' ? 'default' : 'outline'}
                  onClick={() => setSelectedGender('girl')}
                >
                  Menina
                </Button>
                <Button
                  size="sm"
                  variant={showFavoritesOnly ? 'default' : 'outline'}
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                >
                  <Star className="w-4 h-4 mr-1" />
                  Favoritos
                </Button>
              </div>
            </div>

            {/* Lista de nomes salvos */}
            <div className="space-y-3">
              {filteredNames.map((name) => (
                <Card key={name.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-lg">{name.name}</span>
                          <Badge variant="outline" className={getGenderColor(name.gender)}>
                            {getGenderLabel(name.gender)}
                          </Badge>
                          {name.isFavorite && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Origem:</strong> {name.origin} • <strong>Significado:</strong> {name.meaning}
                        </p>
                        {name.notes && (
                          <p className="text-sm text-muted-foreground italic">
                            "{name.notes}"
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 ml-4">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleToggleFavorite(name.id)}
                        >
                          <Heart className={`w-4 h-4 ${name.isFavorite ? 'text-red-500 fill-current' : ''}`} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteName(name.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredNames.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Baby className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhum nome encontrado</p>
                </div>
              )}
            </div>
          </div>
        )}

        {savedNames.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Baby className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Ainda não há nomes salvos</p>
            <p className="text-xs">Explore as sugestões acima! 👶</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};