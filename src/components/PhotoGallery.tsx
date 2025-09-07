import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, Image, Heart, Plus, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PhotoModal } from "./PhotoModal";

interface Photo {
  id: string;
  url: string;
  caption: string;
  photo_type: 'belly' | 'ultrasound' | 'special';
  taken_date: string;
  week_number?: number;
}

export const PhotoGallery = () => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingType, setUploadingType] = useState<Photo['photo_type'] | null>(null);
  const [caption, setCaption] = useState("");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPhotos();
    }
  }, [user]);

  const fetchPhotos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos((data || []) as Photo[]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar fotos",
        description: error.message,
      });
    }
  };

  const handlePhotoSelect = (type: Photo['photo_type']) => {
    setUploadingType(type);
    setCaption(type === 'belly' ? 'Minha barriguinha hoje 🤰' : type === 'ultrasound' ? 'Ultrassom do bebê 👶' : 'Momento especial ✨');
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleCameraCapture = () => {
    // Para mobile, isso vai abrir a câmera
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'camera';
    input.onchange = (e) => handleFileChange(e as any);
    input.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !uploadingType) return;

    setLoading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${uploadingType}_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('photos')
        .insert([{
          user_id: user.id,
          url: publicUrl,
          caption,
          photo_type: uploadingType,
          taken_date: new Date().toISOString().split('T')[0],
        }]);

      if (dbError) throw dbError;

      toast({
        title: "Foto adicionada! 📸",
        description: "Mais uma lembrança especial no seu álbum"
      });

      setUploadingType(null);
      setCaption("");
      fetchPhotos();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar foto",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Foto removida",
        description: "A foto foi excluída do seu álbum"
      });

      fetchPhotos();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao remover foto",
        description: error.message,
      });
    }
  };

  const getTypeColor = (type: Photo['photo_type']) => {
    switch (type) {
      case 'belly': return 'bg-maternal-pink/20 text-maternal-pink';
      case 'ultrasound': return 'bg-maternal-blue/20 text-maternal-blue';
      case 'special': return 'bg-maternal-mint/20 text-maternal-mint';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeLabel = (type: Photo['photo_type']) => {
    switch (type) {
      case 'belly': return 'Barriguinha';
      case 'ultrasound': return 'Ultrassom';
      case 'special': return 'Especial';
      default: return 'Foto';
    }
  };

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
    setIsModalOpen(true);
  };

  const handlePrevious = () => {
    setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNext = () => {
    setSelectedPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          Galeria de Momentos
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Botões de upload */}
        <div className="grid grid-cols-3 gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex flex-col gap-2 h-auto py-4 hover:bg-maternal-pink/10"
                onClick={() => handlePhotoSelect('belly')}
              >
                <div className="w-8 h-8 rounded-full bg-maternal-pink/20 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-maternal-pink" />
                </div>
                <span className="text-xs">Barriguinha</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Foto da Barriguinha</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="caption">Legenda</Label>
                  <Input
                    id="caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Descreva este momento especial..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={handleCameraCapture}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Câmera
                  </Button>
                  <Button 
                    onClick={handleFileSelect}
                    variant="outline"
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Galeria
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex flex-col gap-2 h-auto py-4 hover:bg-maternal-blue/10"
                onClick={() => handlePhotoSelect('ultrasound')}
              >
                <div className="w-8 h-8 rounded-full bg-maternal-blue/20 flex items-center justify-center">
                  <Image className="w-4 h-4 text-maternal-blue" />
                </div>
                <span className="text-xs">Ultrassom</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Ultrassom</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="caption-ultrasound">Legenda</Label>
                  <Input
                    id="caption-ultrasound"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Descreva este momento especial..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={handleCameraCapture}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Câmera
                  </Button>
                  <Button 
                    onClick={handleFileSelect}
                    variant="outline"
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Galeria
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex flex-col gap-2 h-auto py-4 hover:bg-maternal-mint/10"
                onClick={() => handlePhotoSelect('special')}
              >
                <div className="w-8 h-8 rounded-full bg-maternal-mint/20 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-maternal-mint" />
                </div>
                <span className="text-xs">Especial</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Foto Especial</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="caption-special">Legenda</Label>
                  <Input
                    id="caption-special"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Descreva este momento especial..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={handleCameraCapture}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Câmera
                  </Button>
                  <Button 
                    onClick={handleFileSelect}
                    variant="outline"
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Galeria
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Input de arquivo oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Galeria de fotos */}
        {photos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Ainda não há fotos na sua galeria</p>
            <p className="text-xs">Adicione suas primeiras lembranças! 📸</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {photos.map((photo, index) => (
              <div key={photo.id} className="relative group">
                <button
                  onClick={() => handlePhotoClick(index)}
                  className="aspect-square bg-gradient-soft rounded-xl overflow-hidden border w-full hover:border-primary/50 transition-colors"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  
                  {/* Overlay com informações */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-between items-start">
                      <div 
                        className={`text-xs px-2 py-1 rounded-full ${getTypeColor(photo.photo_type)}`}
                      >
                        {getTypeLabel(photo.photo_type)}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-6 h-6 text-white hover:bg-red-500/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto(photo.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="text-white">
                      <p className="text-xs font-medium">{photo.caption}</p>
                      <p className="text-xs opacity-80">
                        {new Date(photo.taken_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}

        <PhotoModal
          photos={photos}
          currentPhotoIndex={selectedPhotoIndex}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onPrevious={photos.length > 1 ? handlePrevious : undefined}
          onNext={photos.length > 1 ? handleNext : undefined}
        />
      </CardContent>
    </Card>
  );
};