"use client";

import * as React from "react";
import Link from "next/link";
import { MessageSquare, ArrowRight, Clock, Dumbbell, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatThreadItem } from "../types";

interface ChatHistoryCardProps {
  thread: ChatThreadItem;
}

export function ChatHistoryCard({ thread }: ChatHistoryCardProps) {
  const getPurposeLabel = (purpose: ChatThreadItem["purpose"]) => {
    switch (purpose) {
      case "planner":
        return "New routine";
      case "plan_revision":
        return "Plan revision";
      case "session_swap":
        return "Exercise swap";
      default:
        return "Workout chat";
    }
  };

  return (
    <div className="group rounded-md border border-border bg-card p-4 sm:p-5 hover:border-muted-foreground/30 hover:bg-surface-2/30 transition-all duration-150 flex flex-col justify-between gap-3">
      {/* Top row: Title, purpose pill, timestamp */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border bg-surface-2 text-[11px] font-medium text-muted-foreground">
              <Sparkles className="size-2.5 text-primary" />
              {getPurposeLabel(thread.purpose)}
            </span>
            {thread.planName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border bg-surface-2 text-[11px] font-medium text-muted-foreground truncate max-w-44">
                <Dumbbell className="size-2.5 text-muted-foreground" />
                {thread.planName}
              </span>
            )}
          </div>

          <h3 className="font-display font-bold text-lg sm:text-xl text-foreground tracking-tight group-hover:text-primary transition-colors line-clamp-1">
            {thread.title}
          </h3>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0 mt-0.5">
          <Clock className="size-3" />
          <span>{thread.updatedAt}</span>
        </div>
      </div>

      {/* Snippet preview */}
      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
        {thread.snippet}
      </p>

      {/* Bottom row: tags / message count + CTA button to redirect to chat */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/50">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <MessageSquare className="size-3 text-muted-foreground" />
            {thread.messageCount} {thread.messageCount === 1 ? "message" : "messages"}
          </span>

          {thread.tags?.map((tag) => (
            <span
              key={tag}
              className="hidden sm:inline-flex text-[11px] text-muted-foreground/80 bg-surface-2 px-1.5 py-0.5 rounded border border-border/60"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Button to redirect to chat screen */}
        <Link
          href={`/planner/${thread.id}`}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md",
            "border border-border bg-surface-2 text-foreground font-semibold text-xs",
            "hover:bg-primary hover:text-primary-foreground hover:border-primary",
            "transition-all duration-150 shrink-0 select-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <span>Open chat</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
