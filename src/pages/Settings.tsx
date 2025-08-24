import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfile } from "@/components/UserProfile";
import { DailyReminders } from "@/components/DailyReminders";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold">Configurações</h1>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="profile" className="text-sm">
              Perfil & Tema
            </TabsTrigger>
            <TabsTrigger value="reminders" className="text-sm">
              Lembretes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <UserProfile />
          </TabsContent>

          <TabsContent value="reminders">
            <DailyReminders />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;