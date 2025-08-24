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
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from("photos")
        .upload(`avatars/${fileName}`, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("photos")
        .getPublicUrl(`avatars/${fileName}`);

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
      {/* Perfil pessoal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Perfil Pessoal
          </CardTitle>
          <CardDescription>
            Personalize sua foto de perfil e nome de exibição
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={preferences.avatar_url} />
              <AvatarFallback className="text-lg">
                {preferences.preferred_name?.charAt(0) || user?.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Button variant="outline" className="relative">
                <Upload className="w-4 h-4 mr-2" />
                Alterar Foto
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_name">Nome de Exibição</Label>
            <Input
              id="preferred_name"
              value={preferences.preferred_name || ""}
              onChange={(e) => setPreferences(prev => ({ ...prev, preferred_name: e.target.value }))}
              placeholder="Como você gostaria de ser chamada?"
            />
          </div>
        </CardContent>
      </Card>

      {/* Personalização de cores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Tema e Cores
          </CardTitle>
          <CardDescription>
            Escolha as cores que mais combinam com você
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {colorPresets.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                className="justify-start h-auto p-3"
                onClick={() => handleColorChange(preset.colors)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: `hsl(${preset.colors.primary})` }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: `hsl(${preset.colors.secondary})` }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: `hsl(${preset.colors.accent})` }}
                    />
                  </div>
                  <span className="text-sm">{preset.name}</span>
                </div>
              </Button>
            ))}
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