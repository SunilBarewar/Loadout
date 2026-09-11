import { Layers, Plus } from "lucide-react";

export default function PlansPage() {
  return (
    <div className="w-full max-w-295 mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground">
            MY PLANS
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Saved routines and weekly training structure.
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="size-4" />
          <span>New routine</span>
        </button>
      </div>

      <div className="rounded-md border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-border bg-surface-2 text-xs font-semibold text-primary">
              Active Routine
            </div>
            <h2 className="font-display font-bold text-2xl text-foreground">
              4-Day Upper / Lower Split
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            4 days / week · Hypertrophy
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Tailored for dumbbells, barbell, and bench with progressive overload tracking.
        </p>
      </div>
    </div>
  );
}
