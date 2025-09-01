import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { DailyReminders } from "@/components/DailyReminders";
import { CalendarAgenda } from "@/components/CalendarAgenda";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function RemindersCard() {
  return (
    <Card className="shadow-card border-0 bg-gradient-soft h-full">
      <CardHeader className="pb-3">
        <Dialog>
          <DialogTrigger asChild>
            <CardTitle className="flex items-center gap-2 cursor-pointer hover:text-primary/80 transition-colors">
              <Bell className="w-5 h-5 text-primary" />
              Lembretes de Hoje
            </CardTitle>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <CalendarAgenda />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="pt-0">
        <DailyReminders />
      </CardContent>
    </Card>
  );
}
