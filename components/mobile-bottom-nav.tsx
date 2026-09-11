"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Bot, Layers, History } from "lucide-react";
import { cn } from "cn";

const mobileNavItems = [
  {
    title: "Today",
    href: "/today",
    icon: CalendarDays,
  },
  {
    title: "Planner",
    href: "/planner",
    icon: Bot,
  },
  {
    title: "Plans",
    href: "/plans",
    icon: Layers,
  },
  {
    title: "History",
    href: "/history",
    icon: History,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  // The active workout page should hide the standard bottom navigation to avoid accidental navigation
  const isWorkoutActive =
    pathname.startsWith("/session") || pathname.startsWith("/workout");

  if (isWorkoutActive) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex min-[901px]:hidden h-16 w-full items-center justify-around border-t border-border bg-card/95 backdrop-blur-md px-2 select-none safe-area-bottom">
      {mobileNavItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/today" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center py-1 gap-1 text-xs transition-colors rounded-md",
              isActive
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground font-medium"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center p-1 rounded-md transition-colors",
                isActive ? "bg-primary/15 text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-5 shrink-0" />
            </div>
            <span className="text-[11px] leading-none">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
