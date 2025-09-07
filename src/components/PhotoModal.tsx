import { Dialog, DialogContent, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  caption: string;
  photo_type: 'belly' | 'ultrasound' | 'special';
  taken_date: string;
  week_number?: number;
}

interface PhotoModalProps {
  photos: Photo[];
  currentPhotoIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

export const PhotoModal = ({ 
  photos, 
  currentPhotoIndex, 
  isOpen, 
  onClose, 
  onPrevious, 
  onNext 
}: PhotoModalProps) => {
  const currentPhoto = photos[currentPhotoIndex];
  
  if (!currentPhoto) return null;

  const getTypeLabel = (type: Photo['photo_type']) => {
    switch (type) {
      case 'belly': return 'Barriguinha';
      case 'ultrasound': return 'Ultrassom';
      case 'special': return 'Especial';
      default: return 'Foto';
    }
  };

  const getTypeColor = (type: Photo['photo_type']) => {
    switch (type) {
      case 'belly': return 'bg-primary/20 text-primary';
      case 'ultrasound': return 'bg-maternal-blue/20 text-maternal-blue';
      case 'special': return 'bg-accent/20 text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-0" aria-describedby="photo-description">
        <DialogDescription id="photo-description" className="sr-only">
          Visualizando foto: {currentPhoto.caption}
        </DialogDescription>
        <div className="relative">
          {/* Close button */}
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>
          </DialogClose>

          {/* Navigation buttons */}
          {photos.length > 1 && onPrevious && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 left-4 z-10 text-white hover:bg-white/20 transform -translate-y-1/2"
              onClick={onPrevious}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}

          {photos.length > 1 && onNext && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-4 z-10 text-white hover:bg-white/20 transform -translate-y-1/2"
              onClick={onNext}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          )}

          {/* Photo */}
          <div className="flex items-center justify-center min-h-[50vh] max-h-[80vh] p-8">
            <img
              src={currentPhoto.url}
              alt={currentPhoto.caption}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Photo info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span 
                    className={`text-xs px-3 py-1 rounded-full ${getTypeColor(currentPhoto.photo_type)}`}
                  >
                    {getTypeLabel(currentPhoto.photo_type)}
                  </span>
                  {photos.length > 1 && (
                    <span className="text-xs text-white/70">
                      {currentPhotoIndex + 1} de {photos.length}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium mb-1">{currentPhoto.caption}</p>
                <p className="text-xs text-white/70">
                  {new Date(currentPhoto.taken_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};