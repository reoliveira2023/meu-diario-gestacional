import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Images } from "lucide-react";
import PhotoGallery from "@/components/PhotoGallery";

export default function GalleryCard() {
  return (
    <Card className="border-0 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Images className="w-5 h-5" /> Galeria de Momentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <PhotoGallery />
      </CardContent>
    </Card>
  );
}
