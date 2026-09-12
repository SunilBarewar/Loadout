"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { logSetAction } from "@/features/sessions/actions";
import {
  formatLoggedSetLabel,
  formatTargetLabel,
} from "@/features/sessions/formatters";
import type { SessionPageData } from "@/features/sessions/schemas";

type SessionWorkoutProps = {
  data: SessionPageData;
};

function getNextSetNumber(
  targetSets: number,
  loggedSetNumbers: Set<number>
): number | null {
  for (let setNumber = 1; setNumber <= targetSets; setNumber += 1) {
    if (!loggedSetNumbers.has(setNumber)) {
      return setNumber;
    }
  }

  return null;
}

export function SessionWorkout({ data }: SessionWorkoutProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { session, exercises, setLogsByExerciseId } = data;
  const isLive = session.status === "active" || session.status === "paused";

  const currentExercise =
    exercises.find(
      (exercise) => exercise.position === session.currentExercisePosition
    ) ?? exercises[0];

  const currentLogs = currentExercise
    ? (setLogsByExerciseId[currentExercise.id] ?? [])
    : [];

  const loggedSetNumbers = useMemo(
    () => new Set(currentLogs.map((log) => log.setNumber)),
    [currentLogs]
  );

  const nextSetNumber = currentExercise
    ? getNextSetNumber(currentExercise.targetSetsSnapshot, loggedSetNumbers)
    : null;

  const statusLabel =
    session.status === "completed"
      ? "COMPLETED"
      : session.status === "paused"
        ? "PAUSED"
        : session.status === "abandoned"
          ? "ABANDONED"
          : "LIVE WORKOUT";

  function handleLogSet(setNumber: number) {
    if (!currentExercise || session.status !== "active") {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await logSetAction({
        sessionId: session.id,
        sessionExerciseId: currentExercise.id,
        setNumber,
        performedReps: currentExercise.targetRepsMinSnapshot,
        performedLoad: currentExercise.targetLoadSnapshot,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.data.sessionCompleted) {
        router.refresh();
        return;
      }

      router.refresh();
    });
  }

  return (
    <>
      <div className="rounded-md border border-border bg-card p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-primary">
              {currentExercise
                ? `Exercise ${currentExercise.position} of ${exercises.length}`
                : "Workout session"}
            </span>
            <h1 className="font-display font-extrabold text-3xl text-foreground mt-1">
              {currentExercise?.nameSnapshot ?? session.titleSnapshot}
            </h1>
            {currentExercise && (
              <p className="text-xs text-muted-foreground">
                Target: {formatTargetLabel(currentExercise)}
              </p>
            )}
          </div>
          <span className="text-xs font-mono text-primary font-bold shrink-0">
            {statusLabel}
          </span>
        </div>

        {session.status === "paused" && isLive && (
          <p className="text-xs text-muted-foreground">
            Session is paused. Resume from the header to log sets.
          </p>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        {currentExercise && (
          <div className="space-y-2">
            {Array.from({ length: currentExercise.targetSetsSnapshot }).map(
              (_, index) => {
                const setNumber = index + 1;
                const loggedSet = currentLogs.find(
                  (log) => log.setNumber === setNumber
                );
                const isCurrent =
                  isLive &&
                  session.status === "active" &&
                  setNumber === nextSetNumber;

                return (
                  <div
                    key={setNumber}
                    className={`flex items-center justify-between p-3 rounded border text-sm ${
                      isCurrent
                        ? "border-primary bg-primary/5"
                        : loggedSet
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-surface-2"
                    }`}
                  >
                    <span className="font-bold">Set {setNumber}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {loggedSet
                        ? formatLoggedSetLabel(loggedSet)
                        : formatTargetLabel(currentExercise)}
                    </span>
                    {loggedSet ? (
                      <span className="size-8 rounded flex items-center justify-center text-primary">
                        <Check className="size-4" />
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={
                          !isCurrent ||
                          isPending ||
                          session.status !== "active"
                        }
                        onClick={() => handleLogSet(setNumber)}
                        className="size-8 rounded flex items-center justify-center font-bold text-xs transition-colors border border-border bg-background text-foreground hover:bg-primary hover:text-primary-foreground disabled:opacity-60 disabled:pointer-events-none"
                      >
                        {isPending && isCurrent ? "…" : "Log"}
                      </button>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}

        {session.status === "completed" && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <Check className="size-4" />
            Session completed
          </div>
        )}

        {session.status === "abandoned" && (
          <p className="text-xs text-muted-foreground">Session was discarded.</p>
        )}
      </div>

      {exercises.length > 1 && (
        <div className="rounded-md border border-border bg-card divide-y divide-border overflow-hidden">
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <span className="font-medium text-foreground">
                {exercise.position}. {exercise.nameSnapshot}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {exercise.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
