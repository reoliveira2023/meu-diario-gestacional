import { Heart, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const MaternaHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<any>(null);
  
  useEffect(() => {
    if (user) {
      fetchUserPreferences();
    }
  }, [user]);

  const fetchUserPreferences = async () => {
    try {
      const { data } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user?.id)
        .single();
      
      setPreferences(data);
    } catch (error) {
      console.error("Error fetching preferences:", error);
    }
  };
  
  return (
    <div className="flex items-center justify-between w-full">
      {/* Logo com foto da mãe */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Heart className="w-8 h-8 text-white fill-white drop-shadow-sm" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-maternal-peach rounded-full opacity-80"></div>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-white font-bold text-xl">MaternaApp</h1>
            <p className="text-white/80 text-sm">Seu diário maternal 💕</p>
          </div>
          {preferences?.avatar_url && (
            <Avatar className="w-10 h-10 border-2 border-white/20">
              <AvatarImage src={preferences.avatar_url} className="object-cover" />
              <AvatarFallback className="bg-white/10 text-white text-sm">
                {preferences?.preferred_name?.charAt(0) || user?.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>

      {/* Configurações */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-white hover:bg-white/10"
        onClick={() => navigate("/settings")}
      >
        <Settings className="w-5 h-5" />
      </Button>
    </div>
  );
};