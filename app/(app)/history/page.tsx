import { History as HistoryIcon, Calendar } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="w-full max-w-295 mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      <div className="pb-2 border-b border-border">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground">
          WORKOUT HISTORY
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Completed sessions, set logs, and strength progression.
        </p>
      </div>

      <div className="rounded-md border border-border bg-card divide-y divide-border overflow-hidden">
        {[
          { date: "Yesterday", name: "Lower Body Heavy (Squat Focus)", sets: 14, duration: "48 min" },
          { date: "3 days ago", name: "Upper Body Hypertrophy (Push)", sets: 16, duration: "45 min" },
          { date: "5 days ago", name: "Pull & Grip Strength", sets: 15, duration: "50 min" },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between p-4 hover:bg-surface-2/40 transition-colors">
            <div className="space-y-0.5">
              <div className="text-xs text-muted-foreground font-medium">{item.date}</div>
              <div className="text-sm font-semibold text-foreground">{item.name}</div>
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {item.sets} sets · {item.duration}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
