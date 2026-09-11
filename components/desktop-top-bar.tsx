"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Sparkles, Calendar } from "lucide-react";

export function DesktopTopBar() {
  const pathname = usePathname();

  const getPageInfo = () => {
    if (pathname === "/today") {
      return {
        title: "Today",
        subtitle: "Daily workout hub and active split",
      };
    }
    if (pathname.startsWith("/planner")) {
      return {
        title: "Planner",
        subtitle: "Chat-first AI planning and routine revisions",
      };
    }
    if (pathname.startsWith("/plans")) {
      return {
        title: "My plans",
        subtitle: "Saved routines and weekly training schedule",
      };
    }
    if (pathname.startsWith("/history")) {
      return {
        title: "History",
        subtitle: "Completed workout logs and progression metrics",
      };
    }
    if (pathname.startsWith("/settings")) {
      return {
        title: "Settings",
        subtitle: "Equipment, units, limitations, and preferences",
      };
    }
    return {
      title: "Loadout",
      subtitle: "AI Gym Coach & Workout Planner",
    };
  };

  const pageInfo = getPageInfo();

  return (
    <header className="hidden min-[901px]:flex h-16 w-full items-center justify-between border-b border-border bg-card/60 backdrop-blur-md px-8 shrink-0 select-none">
      {/* Page Title & Context */}
      <div className="flex flex-col justify-center">
        <h1 className="font-display font-extrabold text-2xl tracking-tight text-foreground leading-none">
          {pageInfo.title}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {pageInfo.subtitle}
        </p>
      </div>

      {/* Right Controls: Active Profile badge */}
      <div className="flex items-center gap-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-muted-foreground shadow-xs">
          <span className="size-2 rounded-full bg-primary animate-pulse" />
          <span className="font-medium text-foreground">Active Routine:</span>
          <span className="text-muted-foreground">Hypertrophy 4-Day</span>
        </div>

        <div className="hidden xl:flex items-center gap-1.5 text-xs text-muted-foreground border-l border-border pl-4">
          <Calendar className="size-3.5 text-muted-foreground" />
          <span>
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </header>
  );
}
