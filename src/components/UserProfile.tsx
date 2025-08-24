import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Palette, Bell, User } from "lucide-react";
import { toast } from "sonner";

interface UserPreferences {
  id?: string;
  user_id: string;
  theme_colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  notification_time: string;
  reminder_enabled: boolean;
  reminder_frequency: string;
  avatar_url?: string;
  preferred_name?: string;
}

const colorPresets = [
  { name: "Rosé Maternal", colors: { primary: "340 35% 75%", secondary: "280 20% 88%", accent: "180 25% 85%" } },
  { name: "Azul Sereno", colors: { primary: "200 60% 70%", secondary: "220 30% 85%", accent: "160 40% 80%" } },
  { name: "Verde Suave", colors: { primary: "150 45% 65%", secondary: "120 25% 85%", accent: "200 30% 80%" } },
  { name: "Lavanda Delicada", colors: { primary: "280 40% 70%", secondary: "300 25% 85%", accent: "260 35% 80%" } },
  { name: "Pêssego Caloroso", colors: { primary: "20 55% 75%", secondary: "40 30% 88%", accent: "10 40% 85%" } }
];

export const UserProfile = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({
    user_id: user?.id || "",
    theme_colors: { primary: "340 35% 75%", secondary: "280 20% 88%", accent: "180 25% 85%" },
    notification_time: "09:00",
    reminder_enabled: true,
    reminder_frequency: "daily",
    preferred_name: user?.user_metadata?.full_name || ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  // Apply theme colors when preferences change
  useEffect(() => {
    if (preferences.theme_colors) {
      const root = document.documentElement;
      root.style.setProperty('--primary', preferences.theme_colors.primary);
      root.style.setProperty('--secondary', preferences.theme_colors.secondary);
      root.style.setProperty('--accent', preferences.theme_colors.accent);
      
      // Also update the maternal colors that are used in the design system
      root.style.setProperty('--maternal-pink', preferences.theme_colors.primary);
      root.style.setProperty('--soft-lavender', preferences.theme_colors.secondary);
      root.style.setProperty('--mint-green', preferences.theme_colors.accent);
    }
  }, [preferences.theme_colors]);

  const fetchPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching preferences:", error);
        return;
      }

      if (data) {
        setPreferences({
          ...data,
          notification_time: data.notification_time?.slice(0, 5) || "09:00",
          theme_colors: typeof data.theme_colors === 'object' && data.theme_colors !== null 
            ? data.theme_colors as { primary: string; secondary: string; accent: string }
            : { primary: "340 35% 75%", secondary: "280 20% 88%", accent: "180 25% 85%" }
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setAvatarFile(file);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/avatars/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from("photos")
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("photos")
        .getPublicUrl(filePath);

      setPreferences(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Foto de perfil atualizada!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Erro ao fazer upload da foto");
    }
  };

  const handleColorChange = (colorSet: { primary: string; secondary: string; accent: string }) => {
    setPreferences(prev => ({ ...prev, theme_colors: colorSet }));
    
    // Aplicar cores dinamicamente
    const root = document.documentElement;
    root.style.setProperty('--primary', colorSet.primary);
    root.style.setProperty('--secondary', colorSet.secondary);
    root.style.setProperty('--accent', colorSet.accent);
    
    // Also update the maternal colors
    root.style.setProperty('--maternal-pink', colorSet.primary);
    root.style.setProperty('--soft-lavender', colorSet.secondary);
    root.style.setProperty('--mint-green', colorSet.accent);
  };

  const savePreferences = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          ...preferences,
          user_id: user.id
        });

      if (error) throw error;

      toast.success("Preferências salvas com sucesso!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Erro ao salvar preferências");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Perfil Social - Estilo Rede Social */}
      <Card className="overflow-hidden bg-gradient-soft border-0 shadow-card">
        <div className="relative">
          {/* Cover Background */}
          <div className="h-32 bg-gradient-maternal"></div>
          
          {/* Profile Section */}
          <div className="relative px-6 pb-6">
            <div className="flex flex-col items-center -mt-16 space-y-4">
              {/* Large Avatar */}
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-background shadow-floating">
                  <AvatarImage src={preferences.avatar_url} className="object-cover" />
                  <AvatarFallback className="text-3xl font-semibold bg-maternal-pink text-primary-foreground">
                    {preferences.preferred_name?.charAt(0) || user?.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Upload Button Overlay */}
                <div className="absolute -bottom-2 -right-2">
                  <Button 
                    size="sm" 
                    className="rounded-full w-10 h-10 p-0 shadow-soft relative overflow-hidden"
                    variant="secondary"
                  >
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </Button>
                </div>
              </div>
              
              {/* User Info */}
              <div className="text-center space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="preferred_name" className="text-sm text-muted-foreground">
                    Como você gostaria de ser chamada?
                  </Label>
                  <Input
                    id="preferred_name"
                    value={preferences.preferred_name || ""}
                    onChange={(e) => setPreferences(prev => ({ ...prev, preferred_name: e.target.value }))}
                    placeholder="Seu nome carinhoso"
                    className="text-center text-lg font-medium border-0 bg-background/50 backdrop-blur"
                  />
                </div>
                <p className="text-muted-foreground text-sm">
                  Mamãe especial em uma jornada única ✨
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Personalização de Cores - Visual Melhorado */}
      <Card className="shadow-card border-maternal-pink/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-maternal-pink">
            <Palette className="w-5 h-5" />
            Personalize Suas Cores
          </CardTitle>
          <CardDescription>
            Escolha o tema que mais combina com seu momento especial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {colorPresets.map((preset, index) => {
              const isActive = 
                preferences.theme_colors.primary === preset.colors.primary &&
                preferences.theme_colors.secondary === preset.colors.secondary &&
                preferences.theme_colors.accent === preset.colors.accent;
              
              return (
                <Button
                  key={index}
                  variant={isActive ? "default" : "outline"}
                  className={`justify-start h-auto p-4 transition-all duration-300 ${
                    isActive 
                      ? "ring-2 ring-primary ring-offset-2 shadow-soft" 
                      : "hover:shadow-soft hover:border-maternal-pink/40"
                  }`}
                  onClick={() => handleColorChange(preset.colors)}
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className="flex gap-2">
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm" 
                        style={{ backgroundColor: `hsl(${preset.colors.primary})` }}
                      />
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm" 
                        style={{ backgroundColor: `hsl(${preset.colors.secondary})` }}
                      />
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm" 
                        style={{ backgroundColor: `hsl(${preset.colors.accent})` }}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-medium">{preset.name}</span>
                      {isActive && (
                        <div className="text-xs text-muted-foreground mt-1">
                          ✨ Tema atual
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
          
          <div className="text-center text-sm text-muted-foreground bg-maternal-pink/5 p-3 rounded-lg">
            💡 As cores escolhidas serão aplicadas em todo o aplicativo
          </div>
        </CardContent>
      </Card>

      {/* Notificações e lembretes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Lembretes Diários
          </CardTitle>
          <CardDescription>
            Configure lembretes para registrar seus momentos especiais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Ativar lembretes</Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações para registrar humor, peso e fotos
              </p>
            </div>
            <Switch
              checked={preferences.reminder_enabled}
              onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, reminder_enabled: checked }))}
            />
          </div>

          {preferences.reminder_enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="notification_time">Horário do lembrete</Label>
                <Input
                  id="notification_time"
                  type="time"
                  value={preferences.notification_time}
                  onChange={(e) => setPreferences(prev => ({ ...prev, notification_time: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder_frequency">Frequência</Label>
                <Select
                  value={preferences.reminder_frequency}
                  onValueChange={(value) => setPreferences(prev => ({ ...prev, reminder_frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Todos os dias</SelectItem>
                    <SelectItem value="weekdays">Dias úteis</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Button onClick={savePreferences} disabled={saving} className="w-full">
        {saving ? "Salvando..." : "Salvar Preferências"}
      </Button>
    </div>
  );
};