import CountdownFromGestation from "@/components/dashboards/CountdownFromGestation";
import GalleryCard from "@/components/dashboards/GalleryCard";
import RemindersCard from "@/components/dashboards/RemindersCard";

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <CountdownFromGestation />
      <RemindersCard />
      <GalleryCard />
    </div>
  );
}
