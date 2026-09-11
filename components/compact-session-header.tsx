"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Pause, Square, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CompactSessionHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPaused, setIsPaused] = React.useState(false);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(1458); // Dummy workout timer: 24:18

  const isWorkoutActive =
    pathname.startsWith("/session") || pathname.startsWith("/workout");

  React.useEffect(() => {
    if (!isWorkoutActive || isPaused) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isWorkoutActive, isPaused]);

  if (!isWorkoutActive) {
    return null;
  }

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeFormatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md px-4 py-2.5 flex items-center justify-between shrink-0 shadow-sm select-none">
      <div className="flex items-center gap-3">
        <span className="relative flex size-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full size-2.5 bg-primary" />
        </span>
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Active Session
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">
            {timeFormatted} {isPaused ? "(Paused)" : ""}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsPaused(!isPaused)}
          className="h-8 px-2.5 text-xs font-semibold border-border bg-surface-2 text-foreground hover:bg-border transition-colors gap-1.5"
        >
          {isPaused ? <Play className="size-3 text-primary" /> : <Pause className="size-3" />}
          <span>{isPaused ? "Resume" : "Pause"}</span>
        </Button>

        <Button
          size="sm"
          variant="destructive"
          onClick={() => router.push("/today")}
          className="h-8 px-2.5 text-xs font-bold bg-destructive text-white hover:bg-destructive/90 transition-colors gap-1.5"
        >
          <Square className="size-3 fill-current" />
          <span>End Session</span>
        </Button>
      </div>
    </div>
  );
}
