// src/pages/Index.tsx  (trecho principal – página completa se quiser)
import { useState, useEffect } from "react";
import { MaternaHeader } from "@/components/MaternaHeader";
import { MoodDiary } from "@/components/MoodDiary";
import { PhotoGallery } from "@/components/PhotoGallery";
import { BabyShoppingList } from "@/components/BabyShoppingList";
import { PregnancyTimelineInteractive } from "@/components/PregnancyTimelineInteractive";
import { MedicalExamsTracker } from "@/components/MedicalExamsTracker";
import { WeightChart } from "@/components/WeightChart";
import { BabyNamesGenerator } from "@/components/BabyNamesGenerator";
import { BabyLetters } from "@/components/BabyLetters";
import { DiarySearch } from "@/components/DiarySearch";
import { DashboardInsights } from "@/components/DashboardInsights";
import FamilyManager from "@/components/FamilyManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Heart, Camera, Stethoscope, Baby, LogOut, User, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

// use o Dashboard que preferir
import NewDashboard from "@/components/dashboards/NewDashboard";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Faixa superior com gradiente */}
      <div className="bg-gradient-maternal">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-5 space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <MaternaHeader />
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-white text-xs sm:text-sm">
                <User className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{user.email?.split("@")[0]}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={signOut} className="text-xs sm:text-sm">
                <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
                Sair
              </Button>
            </div>
          </div>

          {/* Insights */}
          <DashboardInsights />

          {/* Topo com 3 colunas (Gestação | Agenda | Galeria) */}
          <NewDashboard />
        </div>
      </div>

      {/* Conteúdo com abas */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-8 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-card/50 backdrop-blur-sm sticky top-4 z-10">
            <TabsTrigger value="home" className="flex flex-col gap-1 py-2 sm:py-3" data-tab="home">
              <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs">Início</span>
            </TabsTrigger>
            <TabsTrigger value="diary" className="flex flex-col gap-1 py-2 sm:py-3">
              <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs">Diário</span>
            </TabsTrigger>
            <TabsTrigger value="medical" className="flex flex-col gap-1 py-2 sm:py-3">
              <Stethoscope className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs">Médico</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex flex-col gap-1 py-2 sm:py-3" data-tab="photos">
              <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs">Fotos</span>
            </TabsTrigger>
            <TabsTrigger value="more" className="flex flex-col gap-1 py-2 sm:py-3">
              <Baby className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs">Mais</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6" />
          <TabsContent value="diary" className="space-y-6">
            <MoodDiary />
            <BabyLetters />
            <DiarySearch />
          </TabsContent>
          <TabsContent value="medical" className="space-y-6">
            <MedicalExamsTracker />
            <WeightChart />
          </TabsContent>
          <TabsContent value="photos" className="space-y-6">
            <PhotoGallery />
            <PregnancyTimelineInteractive />
          </TabsContent>
          <TabsContent value="more" className="space-y-6">
            <BabyNamesGenerator />
            <BabyShoppingList />
            <FamilyManager />
            <div className="bg-gradient-soft rounded-xl p-4 text-center">
              <h3 className="font-medium mb-2">Compartilhe sua jornada 💕</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Convide família e amigos para acompanhar seus momentos especiais
              </p>
              <div className="text-xs text-muted-foreground">🔒 Seus dados estão seguros e privados</div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
