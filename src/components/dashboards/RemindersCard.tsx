import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { DailyReminders } from "@/components/DailyReminders";

export default function RemindersCard() {
  return (
    <Card className="shadow-card border-0 bg-gradient-soft h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Lembretes de Hoje
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <DailyReminders />
      </CardContent>
    </Card>
  );
}
