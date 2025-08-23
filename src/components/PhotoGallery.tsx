import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Image, Heart, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Photo {
  id: string;
  url: string;
  caption: string;
  date: string;
  type: 'belly' | 'ultrasound' | 'special';
}

export const PhotoGallery = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const { toast } = useToast();

  const handlePhotoUpload = (type: Photo['type']) => {
    // Simular upload de foto
    const newPhoto: Photo = {
      id: Date.now().toString(),
      url: "/placeholder.svg", // Placeholder para demonstração
      caption: type === 'belly' ? 'Minha barriguinha hoje 🤰' : type === 'ultrasound' ? 'Ultrassom do bebê 👶' : 'Momento especial ✨',
      date: new Date().toISOString(),
      type
    };

    setPhotos(prev => [newPhoto, ...prev]);
    toast({
      title: "Foto adicionada! 📸",
      description: "Mais uma lembrança especial no seu álbum"
    });
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
    toast({
      title: "Foto removida",
      description: "A foto foi excluída do seu álbum"
    });
  };

  const getTypeColor = (type: Photo['type']) => {
    switch (type) {
      case 'belly': return 'bg-maternal-pink/20 text-maternal-pink';
      case 'ultrasound': return 'bg-maternal-blue/20 text-maternal-blue';
      case 'special': return 'bg-maternal-mint/20 text-maternal-mint';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeLabel = (type: Photo['type']) => {
    switch (type) {
      case 'belly': return 'Barriguinha';
      case 'ultrasound': return 'Ultrassom';
      case 'special': return 'Especial';
      default: return 'Foto';
    }
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
          <Button
            variant="outline"
            className="flex flex-col gap-2 h-auto py-4 hover:bg-maternal-pink/10"
            onClick={() => handlePhotoUpload('belly')}
          >
            <div className="w-8 h-8 rounded-full bg-maternal-pink/20 flex items-center justify-center">
              <Camera className="w-4 h-4 text-maternal-pink" />
            </div>
            <span className="text-xs">Barriguinha</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col gap-2 h-auto py-4 hover:bg-maternal-blue/10"
            onClick={() => handlePhotoUpload('ultrasound')}
          >
            <div className="w-8 h-8 rounded-full bg-maternal-blue/20 flex items-center justify-center">
              <Image className="w-4 h-4 text-maternal-blue" />
            </div>
            <span className="text-xs">Ultrassom</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col gap-2 h-auto py-4 hover:bg-maternal-mint/10"
            onClick={() => handlePhotoUpload('special')}
          >
            <div className="w-8 h-8 rounded-full bg-maternal-mint/20 flex items-center justify-center">
              <Heart className="w-4 h-4 text-maternal-mint" />
            </div>
            <span className="text-xs">Especial</span>
          </Button>
        </div>

        {/* Galeria de fotos */}
        {photos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Ainda não há fotos na sua galeria</p>
            <p className="text-xs">Adicione suas primeiras lembranças! 📸</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <div className="aspect-square bg-gradient-soft rounded-xl overflow-hidden border">
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay com informações */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-between items-start">
                      <div 
                        className={`text-xs px-2 py-1 rounded-full ${getTypeColor(photo.type)}`}
                      >
                        {getTypeLabel(photo.type)}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-6 h-6 text-white hover:bg-red-500/20"
                        onClick={() => handleDeletePhoto(photo.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="text-white">
                      <p className="text-xs font-medium">{photo.caption}</p>
                      <p className="text-xs opacity-80">
                        {new Date(photo.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};