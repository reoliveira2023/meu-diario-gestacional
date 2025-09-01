// src/components/dashboards/Dashboard.tsx
import CountdownFromGestation from "./CountdownFromGestation";
import RemindersCard from "./AgendaCard";
import GalleryCard from "./GalleryCard";

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1">
        <CountdownFromGestation />
      </div>
      <div className="lg:col-span-1">
        <RemindersCard />
      </div>
      <div className="lg:col-span-1">
        <GalleryCard />
      </div>
    </div>
  );
}

