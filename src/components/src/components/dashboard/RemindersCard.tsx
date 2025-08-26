import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";
import DailyReminders from "@/components/DailyReminders";

export default function RemindersCard() {
  return (
    <Card className="border-0 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" /> Lembretes de Hoje
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DailyReminders />
      </CardContent>
    </Card>
  );
}
