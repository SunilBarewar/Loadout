import { Bot, Sparkles, Send } from "lucide-react";

export default function PlannerPage() {
  return (
    <div className="w-full max-w-295 mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      <div className="pb-2 border-b border-border">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground">
          AI WORKOUT PLANNER
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Chat-first AI routine generation and progressive overload adjustments.
        </p>
      </div>

      <div className="rounded-md border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-primary text-sm font-semibold">
          <Bot className="size-5" />
          <span>Interactive Plan Assistant</span>
        </div>

        <p className="text-sm text-muted-foreground">
          Describe any adjustments or create a completely new routine split. E.g. &ldquo;Shorten Wednesday&apos;s workout to 30 minutes&rdquo; or &ldquo;Swap dumbbell bench for smith machine&rdquo;.
        </p>

        <div className="relative">
          <input
            type="text"
            placeholder="Tell Loadout how you want to adjust your workout..."
            className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary pr-12"
          />
          <button className="absolute right-2.5 top-2.5 p-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
