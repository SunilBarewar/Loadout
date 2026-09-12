"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Pause, Square, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  endSessionAction,
  pauseSessionAction,
  resumeSessionAction,
} from "@/features/sessions/actions";
import type { ActiveSessionHeaderData } from "@/features/sessions/schemas";

type CompactSessionHeaderProps = {
  activeSession: ActiveSessionHeaderData | null;
};

export function CompactSessionHeader({
  activeSession,
}: CompactSessionHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [sessionNotes, setSessionNotes] = React.useState("");

  const isOnActiveSessionPage =
    activeSession != null && pathname === `/session/${activeSession.id}`;

  const isPaused = activeSession?.status === "paused";

  React.useEffect(() => {
    if (!activeSession || !isOnActiveSessionPage) {
      return;
    }

    const startedAtMs = new Date(activeSession.startedAt).getTime();
    const updateElapsed = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)));
    };

    updateElapsed();
    if (isPaused) {
      return;
    }

    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeSession, isOnActiveSessionPage, isPaused]);

  if (!activeSession || !isOnActiveSessionPage) {
    return null;
  }

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeFormatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  function handlePauseToggle() {
    setError(null);
    startTransition(async () => {
      const result = isPaused
        ? await resumeSessionAction(activeSession!.id)
        : await pauseSessionAction(activeSession!.id);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  function handleEndSession(mode: "complete" | "abandon") {
    setError(null);
    startTransition(async () => {
      const result = await endSessionAction(
        activeSession!.id,
        mode,
        sessionNotes.trim() || null
      );
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md px-4 py-2.5 flex items-center justify-between shrink-0 shadow-sm select-none">
      <div className="flex items-center gap-3 min-w-0">
        <span className="relative flex size-2.5 shrink-0">
          {!isPaused && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          )}
          <span className="relative inline-flex rounded-full size-2.5 bg-primary" />
        </span>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            {isPaused ? "Paused Session" : "Active Session"}
          </span>
          <span className="text-[11px] text-muted-foreground font-mono truncate">
            {timeFormatted} {isPaused ? "(Paused)" : ""}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {error && (
          <span className="text-[10px] text-destructive max-w-28 truncate hidden sm:inline">
            {error}
          </span>
        )}

        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={handlePauseToggle}
          className="h-8 px-2.5 text-xs font-semibold border-border bg-surface-2 text-foreground hover:bg-border transition-colors gap-1.5"
        >
          {isPaused ? (
            <Play className="size-3 text-primary" />
          ) : (
            <Pause className="size-3" />
          )}
          <span>{isPaused ? "Resume" : "Pause"}</span>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                size="sm"
                variant="destructive"
                disabled={isPending}
                className="h-8 px-2.5 text-xs font-bold bg-destructive text-white hover:bg-destructive/90 transition-colors gap-1.5"
              >
                <Square className="size-3 fill-current" />
                <span>End Session</span>
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>End this workout?</AlertDialogTitle>
              <AlertDialogDescription>
                Unlogged exercises will be marked skipped. Logged sets are kept
                in your history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-1.5 px-1">
              <Label htmlFor="session-notes">Session notes (optional)</Label>
              <Textarea
                id="session-notes"
                value={sessionNotes}
                onChange={(event) => setSessionNotes(event.target.value)}
                placeholder="e.g. felt fatigued, shortened workout"
                rows={2}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep going</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleEndSession("abandon")}
                className="bg-surface-2 text-foreground hover:bg-border"
              >
                Discard
              </AlertDialogAction>
              <AlertDialogAction onClick={() => handleEndSession("complete")}>
                Finish workout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
