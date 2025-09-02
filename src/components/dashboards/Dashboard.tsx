// src/components/dashboards/Dashboard.tsx
import CountdownFromGestation from "./CountdownFromGestation";
import AgendaCard from "./AgendaCard";
import GalleryCard from "./GalleryCard";

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1">
        <CountdownFromGestation />
      </div>
      <div className="lg:col-span-1">
        <AgendaCard />
      </div>
      <div className="lg:col-span-1">
        <GalleryCard />
      </div>
    </div>
  );
}

