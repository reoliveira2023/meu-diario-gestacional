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
import { DashboardInsights } from "@/components/DashboardInsights";
import FamilyManager from "@/components/FamilyManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Heart, Camera, Stethoscope, Baby, LogOut, User, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

// ✅ importa explicitamente o novo componente
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
      {/* Header com visual mais suave */}
      <div className="bg-gradient-maternal px-2 sm:px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <MaternaHeader />
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-white/90 text-xs sm:text-sm rounded-2xl hover:bg-white/10 backdrop-blur-sm">
              <User className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline font-medium">{user.email?.split("@")[0]}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={signOut} className="text-xs sm:text-sm rounded-2xl bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
              <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Insights com design mais delicado */}
        <div className="mb-8">
          <DashboardInsights />
        </div>

        {/* Dashboard principal redesenhado */}
        <NewDashboard />
      </div>

      <div className="px-2 sm:px-6 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8 bg-gradient-card/80 backdrop-blur-lg sticky top-4 z-10 rounded-3xl shadow-floating border-0 p-2">
            <TabsTrigger value="home" className="flex flex-col gap-2 py-4 sm:py-5 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-soft transition-all duration-300" data-tab="home">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs font-medium">Início</span>
            </TabsTrigger>
            <TabsTrigger value="diary" className="flex flex-col gap-2 py-4 sm:py-5 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-soft transition-all duration-300">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs font-medium">Diário</span>
            </TabsTrigger>
            <TabsTrigger value="medical" className="flex flex-col gap-2 py-4 sm:py-5 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-soft transition-all duration-300">
              <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs font-medium">Médico</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex flex-col gap-2 py-4 sm:py-5 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-soft transition-all duration-300" data-tab="photos">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs font-medium">Fotos</span>
            </TabsTrigger>
            <TabsTrigger value="more" className="flex flex-col gap-2 py-4 sm:py-5 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-soft transition-all duration-300">
              <Baby className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs font-medium">Mais</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6" />
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
