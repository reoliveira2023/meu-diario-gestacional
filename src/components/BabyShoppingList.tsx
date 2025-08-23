import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Baby, Shirt, Home, Heart, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ShoppingItem {
  id: string;
  name: string;
  category: 'clothes' | 'care' | 'furniture' | 'accessories';
  essential: boolean;
  completed: boolean;
}

const initialItems: ShoppingItem[] = [
  // Roupas
  { id: '1', name: 'Bodies (6-8 unidades)', category: 'clothes', essential: true, completed: false },
  { id: '2', name: 'Macacões (4-6 unidades)', category: 'clothes', essential: true, completed: false },
  { id: '3', name: 'Meias e luvas', category: 'clothes', essential: true, completed: false },
  { id: '4', name: 'Toucas (2-3 unidades)', category: 'clothes', essential: true, completed: false },
  
  // Cuidados
  { id: '5', name: 'Fraldas RN e P', category: 'care', essential: true, completed: false },
  { id: '6', name: 'Lenços umedecidos', category: 'care', essential: true, completed: false },
  { id: '7', name: 'Sabonete neutro', category: 'care', essential: true, completed: false },
  { id: '8', name: 'Pomada para assaduras', category: 'care', essential: true, completed: false },
  
  // Móveis
  { id: '9', name: 'Berço', category: 'furniture', essential: true, completed: false },
  { id: '10', name: 'Colchão e roupa de cama', category: 'furniture', essential: true, completed: false },
  { id: '11', name: 'Cômoda/trocador', category: 'furniture', essential: false, completed: false },
  
  // Acessórios
  { id: '12', name: 'Mamadeiras', category: 'accessories', essential: true, completed: false },
  { id: '13', name: 'Chupetas', category: 'accessories', essential: false, completed: false },
  { id: '14', name: 'Carrinho de bebê', category: 'accessories', essential: true, completed: false },
  { id: '15', name: 'Bebê conforto', category: 'accessories', essential: true, completed: false }
];

const categoryConfig = {
  clothes: { icon: Shirt, label: 'Roupinhas', color: 'bg-maternal-pink/20 text-maternal-pink' },
  care: { icon: Heart, label: 'Cuidados', color: 'bg-maternal-mint/20 text-maternal-mint' },
  furniture: { icon: Home, label: 'Móveis', color: 'bg-maternal-lavender/20 text-maternal-lavender' },
  accessories: { icon: Baby, label: 'Acessórios', color: 'bg-maternal-peach/20 text-maternal-peach' }
};

export const BabyShoppingList = () => {
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);

  const handleToggleItem = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const completedItems = items.filter(item => item.completed).length;
  const totalItems = items.length;
  const progress = (completedItems / totalItems) * 100;

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" />
          Lista do Enxoval
        </CardTitle>
        
        {/* Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso do enxoval</span>
            <span className="font-medium">{completedItems}/{totalItems}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {Object.entries(groupedItems).map(([category, categoryItems]) => {
          const config = categoryConfig[category as keyof typeof categoryConfig];
          const categoryCompleted = categoryItems.filter(item => item.completed).length;
          
          return (
            <div key={category} className="space-y-3">
              {/* Header da categoria */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <config.icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-medium">{config.label}</h3>
                  <Badge variant="outline" className="text-xs">
                    {categoryCompleted}/{categoryItems.length}
                  </Badge>
                </div>
              </div>
              
              {/* Itens da categoria */}
              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      item.completed ? 'bg-muted/50 opacity-75' : 'bg-background hover:bg-accent/20'
                    }`}
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => handleToggleItem(item.id)}
                      className="data-[state=checked]:bg-primary"
                    />
                    
                    <div className="flex-1">
                      <span className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {item.name}
                      </span>
                      {item.essential && (
                        <Badge variant="outline" className="ml-2 text-xs bg-red-50 text-red-600 border-red-200">
                          Essencial
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
        {/* Botão adicionar item personalizado */}
        <Button variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar item personalizado
        </Button>
      </CardContent>
    </Card>
  );
};