import { MaternaHeader } from "@/components/MaternaHeader";
import { PregnancyWeekCalculator } from "@/components/PregnancyWeekCalculator";
import { MoodDiary } from "@/components/MoodDiary";
import { PhotoGallery } from "@/components/PhotoGallery";
import { BabyShoppingList } from "@/components/BabyShoppingList";
import { PregnancyTimeline } from "@/components/PregnancyTimeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Heart, Camera, ShoppingBag } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <MaternaHeader />
      
      <div className="px-4 pb-20">
        {/* Calculadora sempre visível */}
        <div className="mb-6">
          <PregnancyWeekCalculator />
        </div>

        {/* Navegação por abas */}
        <Tabs defaultValue="diary" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-card/50 backdrop-blur-sm sticky top-4 z-10">
            <TabsTrigger value="diary" className="flex flex-col gap-1 py-3">
              <Heart className="w-4 h-4" />
              <span className="text-xs">Diário</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex flex-col gap-1 py-3">
              <Camera className="w-4 h-4" />
              <span className="text-xs">Fotos</span>
            </TabsTrigger>
            <TabsTrigger value="shopping" className="flex flex-col gap-1 py-3">
              <ShoppingBag className="w-4 h-4" />
              <span className="text-xs">Enxoval</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex flex-col gap-1 py-3">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">Timeline</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diary" className="space-y-6">
            <MoodDiary />
          </TabsContent>

          <TabsContent value="photos" className="space-y-6">
            <PhotoGallery />
          </TabsContent>

          <TabsContent value="shopping" className="space-y-6">
            <BabyShoppingList />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <PregnancyTimeline />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
