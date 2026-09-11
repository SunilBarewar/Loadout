import Link from "next/link";
import { Check, Flame, ArrowLeft } from "lucide-react";

export default function SessionPage() {
  return (
    <div className="w-full max-w-[720px] mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <Link
          href="/today"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Exit to Today</span>
        </Link>
        <span className="text-xs font-mono text-primary font-bold">
          LIVE WORKOUT
        </span>
      </div>

      <div className="rounded-md border border-border bg-card p-6 space-y-6">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-primary">
            Current Exercise · 1 of 5
          </span>
          <h1 className="font-display font-extrabold text-3xl text-foreground mt-1">
            Barbell Bench Press
          </h1>
          <p className="text-xs text-muted-foreground">
            Target: 4 sets × 6–8 reps · 80 kg
          </p>
        </div>

        {/* Set Logger Rows */}
        <div className="space-y-2">
          {[
            { set: 1, prev: "80 kg × 8 reps", state: "done" },
            { set: 2, prev: "80 kg × 7 reps", state: "current" },
            { set: 3, prev: "80 kg × 6 reps", state: "pending" },
            { set: 4, prev: "80 kg × 6 reps", state: "pending" },
          ].map((s) => (
            <div
              key={s.set}
              className={`flex items-center justify-between p-3 rounded border text-sm ${
                s.state === "current"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-surface-2"
              }`}
            >
              <span className="font-bold">Set {s.set}</span>
              <span className="font-mono text-xs text-muted-foreground">{s.prev}</span>
              <button
                className={`size-8 rounded flex items-center justify-center font-bold text-xs transition-colors ${
                  s.state === "done"
                    ? "bg-primary text-primary-foreground"
                    : s.state === "current"
                    ? "border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    : "border border-border text-muted-foreground"
                }`}
              >
                {s.state === "done" ? <Check className="size-4" /> : "Log"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
