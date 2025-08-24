import { Heart, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const MaternaHeader = () => {
  const navigate = useNavigate();
  
  return (
    <header className="bg-gradient-maternal shadow-soft rounded-b-3xl px-4 py-6 mb-6">
      <div className="flex items-center justify-between">
        {/* Logo e nome */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Heart className="w-8 h-8 text-white fill-white drop-shadow-sm" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-maternal-peach rounded-full opacity-80"></div>
          </div>
          <div>
            <h1 className="text-white font-bold text-xl">MaternaApp</h1>
            <p className="text-white/80 text-sm">Seu diário maternal 💕</p>
          </div>
        </div>

        {/* Ações do usuário */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <User className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/10"
            onClick={() => navigate("/settings")}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};