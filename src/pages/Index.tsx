import { MaternaHeader } from "@/components/MaternaHeader";
import { PregnancyWeekCalculator } from "@/components/PregnancyWeekCalculator";
import { MoodDiary } from "@/components/MoodDiary";
import { PhotoGallery } from "@/components/PhotoGallery";
import { BabyShoppingList } from "@/components/BabyShoppingList";
import { PregnancyTimeline } from "@/components/PregnancyTimeline";
import { MedicalExamsTracker } from "@/components/MedicalExamsTracker";
import { WeightChart } from "@/components/WeightChart";
import { BabyNamesGenerator } from "@/components/BabyNamesGenerator";
import { BabyLetters } from "@/components/BabyLetters";
import { CountdownTimer } from "@/components/CountdownTimer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Heart, Camera, ShoppingBag, Stethoscope, Scale, Baby, Mail } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <MaternaHeader />
      
      <div className="px-4 pb-20">
        {/* Calculadora e Contagem Regressiva */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <PregnancyWeekCalculator />
          <CountdownTimer />
        </div>

        {/* Navegação por abas */}
        <Tabs defaultValue="diary" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-card/50 backdrop-blur-sm sticky top-4 z-10">
            <TabsTrigger value="diary" className="flex flex-col gap-1 py-3">
              <Heart className="w-4 h-4" />
              <span className="text-xs">Diário</span>
            </TabsTrigger>
            <TabsTrigger value="medical" className="flex flex-col gap-1 py-3">
              <Stethoscope className="w-4 h-4" />
              <span className="text-xs">Médico</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex flex-col gap-1 py-3">
              <Camera className="w-4 h-4" />
              <span className="text-xs">Fotos</span>
            </TabsTrigger>
            <TabsTrigger value="more" className="flex flex-col gap-1 py-3">
              <Baby className="w-4 h-4" />
              <span className="text-xs">Mais</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diary" className="space-y-6">
            <MoodDiary />
            <BabyLetters />
          </TabsContent>

          <TabsContent value="medical" className="space-y-6">
            <MedicalExamsTracker />
            <WeightChart />
          </TabsContent>

          <TabsContent value="photos" className="space-y-6">
            <PhotoGallery />
            <PregnancyTimeline />
          </TabsContent>

          <TabsContent value="more" className="space-y-6">
            <BabyNamesGenerator />
            <BabyShoppingList />
            
            {/* Links para compartilhamento */}
            <div className="bg-gradient-soft rounded-xl p-4 text-center">
              <h3 className="font-medium mb-2">Compartilhe sua jornada 💕</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Em breve: compartilhe momentos especiais com família e amigos
              </p>
              <div className="text-xs text-muted-foreground">
                🔒 Seus dados estão seguros e privados
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
