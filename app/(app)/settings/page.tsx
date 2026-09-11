import { Settings as SettingsIcon, Shield, Sliders, Dumbbell } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="w-full max-w-295 mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      <div className="pb-2 border-b border-border">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground">
          SETTINGS
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage gym equipment, units, limitations, and account preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-md border border-border bg-card p-6 space-y-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Dumbbell className="size-4 text-primary" />
            <span>Available Equipment</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Commercial gym setup: Barbells, dumbbells up to 40kg, cable tower, squat rack.
          </p>
        </div>

        <div className="rounded-md border border-border bg-card p-6 space-y-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Sliders className="size-4 text-primary" />
            <span>Units & Measurements</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Kilograms (kg) · 24-hour clock.
          </p>
        </div>
      </div>
    </div>
  );
}
