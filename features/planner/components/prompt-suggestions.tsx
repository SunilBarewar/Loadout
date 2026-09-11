"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PromptSuggestion } from "../types";

const DEFAULT_SUGGESTIONS: PromptSuggestion[] = [
  {
    id: "hypertrophy-ppl",
    label: "Build a 4-day push/pull/legs split",
    prompt: "Generate a 4-day push/pull/legs hypertrophy split focusing on compound barbell and dumbbell movements with 8–12 rep targets.",
  },
  {
    id: "swap-bench",
    label: "Swap barbell bench for dumbbell press",
    prompt: "I have mild shoulder impingement. Swap the flat barbell bench press for an incline dumbbell press and recommend safe chest accessory work.",
  },
  {
    id: "hotel-conditioning",
    label: "30-min kettlebell conditioning circuit",
    prompt: "I am traveling and only have dumbbells and kettlebells. Build a high-density 30-minute full body conditioning circuit.",
  },
  {
    id: "shoulder-safe",
    label: "Shoulder-safe upper body plan",
    prompt: "Create an upper body workout that eliminates overhead barbell pressing and focuses on landmine presses, chest-supported rows, and cable lateral raises.",
  },
  {
    id: "deload-week",
    label: "Deload week volume reduction",
    prompt: "Adjust my current routine for a deload week: reduce working set volume by 40% and keep intensity at RPE 7.",
  },
];

interface PromptSuggestionsProps {
  onSelect: (prompt: string) => void;
  suggestions?: PromptSuggestion[];
  className?: string;
}

export function PromptSuggestions({
  onSelect,
  suggestions = DEFAULT_SUGGESTIONS,
  className,
}: PromptSuggestionsProps) {
  return (
    <div className={cn("w-full flex flex-wrap items-center justify-center gap-2", className)}>
      {suggestions.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.prompt)}
          className={cn(
            "group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border bg-card",
            "text-xs font-medium text-muted-foreground transition-all duration-150 cursor-pointer select-none",
            "hover:bg-surface-2 hover:text-foreground hover:border-muted-foreground/40 hover:scale-[1.02]",
            "active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <Sparkles className="size-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
