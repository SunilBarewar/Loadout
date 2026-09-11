"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlannerPromptInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (prompt: string) => void;
  isSubmitting?: boolean;
  className?: string;
}

export function PlannerPromptInput({
  value,
  onChange,
  onSubmit,
  isSubmitting = false,
  className,
}: PlannerPromptInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isSubmitting) return;
    onSubmit(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative w-full rounded-md border border-border bg-card p-4 sm:p-5 transition-all duration-200",
        "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
        // Fixed height box matching design reference
        "h-38 sm:h-44 flex flex-col justify-between shadow-xs",
        className
      )}
    >
      {/* Top: Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tell Loadout what you're planning — a 4-day hypertrophy split, quick 30-min kettlebell session, shoulder-sparing push day..."
        className="w-full flex-1 resize-none bg-transparent border-0 p-0 text-sm sm:text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 leading-relaxed font-sans"
        aria-label="Workout plan prompt"
        disabled={isSubmitting}
      />

      {/* Bottom Bar: Keyboard shortcut helper & send button */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40 select-none">
        <span className="text-[11px] text-muted-foreground/70 hidden sm:inline">
          Press <kbd className="px-1 py-0.5 rounded border border-border bg-surface-2 text-[10px] font-mono">Enter ↵</kbd> to send, <kbd className="px-1 py-0.5 rounded border border-border bg-surface-2 text-[10px] font-mono">Shift + Enter</kbd> for new line
        </span>
        <span className="text-[11px] text-muted-foreground/70 sm:hidden">
          AI Routine Generator
        </span>

        {/* Send Button with ArrowUp (matching the screenshot) */}
        <button
          type="submit"
          disabled={!value.trim() || isSubmitting}
          aria-label="Send prompt"
          className={cn(
            "size-9 rounded-md flex items-center justify-center transition-all",
            "bg-primary text-primary-foreground font-semibold hover:bg-primary/90",
            "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
          )}
        >
          <ArrowUp className="size-4 stroke-[2.5]" />
        </button>
      </div>
    </form>
  );
}
