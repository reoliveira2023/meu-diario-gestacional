import { useGestation } from "@/hooks/useGestation";
import { CountdownTimer } from "@/components/CountdownTimer"; // você já tem
import { addWeeks } from "date-fns";

/**
 * Wrapper que lê a LMP (lastPeriod) do Supabase via useGestation
 * e injeta as props no CountdownTimer.
 */
export default function CountdownFromGestation() {
  const { loading, calc } = useGestation();

  if (loading) {
    return (
      <div className="h-40 rounded-xl bg-muted/40 animate-pulse" />
    );
  }

  const lastPeriod = calc?.lmpDate; // Date
  const dueDate = lastPeriod ? addWeeks(lastPeriod, 40) : undefined;

  return <CountdownTimer lastPeriod={lastPeriod ?? undefined} dueDate={dueDate} />;
}
