import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PhotoModal } from "./PhotoModal";

interface Photo {
  id: string;
  url: string;
  caption: string;
  photo_type: 'belly' | 'ultrasound' | 'special';
  taken_date: string;
  week_number?: number;
}

export const PhotoGalleryThumbnails = () => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRecentPhotos();
    }
  }, [user]);

  const fetchRecentPhotos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      setPhotos((data || []) as Photo[]);
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
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

  if (photos.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-xs">Guarde seus momentos mais especiais durante a gestação 💕</p>
      </div>
    );
  }

  // Fill remaining slots with placeholder if less than 4 photos
  const displayItems = [...photos];
  while (displayItems.length < 4) {
    displayItems.push(null as any);
  }

  return (
    <>
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground text-center">
          Guarde seus momentos mais especiais durante a gestação 💕
        </p>
        
        <div className="grid grid-cols-2 gap-2">
          {displayItems.map((photo, index) => (
            <div key={photo?.id || `placeholder-${index}`} className="aspect-square">
              {photo ? (
                <button
                  onClick={() => handlePhotoClick(index)}
                  className="w-full h-full rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-colors group"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </button>
              ) : (
                <div className="w-full h-full rounded-lg border-2 border-dashed border-border/30 flex items-center justify-center bg-muted/30">
                  <Plus className="w-4 h-4 text-muted-foreground/50" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <PhotoModal
        photos={photos}
        currentPhotoIndex={selectedPhotoIndex}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPrevious={photos.length > 1 ? handlePrevious : undefined}
        onNext={photos.length > 1 ? handleNext : undefined}
      />
    </>
  );
};