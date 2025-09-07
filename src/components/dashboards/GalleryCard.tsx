import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Images } from "lucide-react";
import { PhotoGalleryThumbnails } from "@/components/PhotoGalleryThumbnails";

export default function GalleryCard() {
  return (
    <Card className="shadow-card border-0 bg-gradient-soft h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Images className="w-5 h-5 text-primary" />
          Galeria de Momentos
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <PhotoGalleryThumbnails />
      </CardContent>
    </Card>
  );
}
