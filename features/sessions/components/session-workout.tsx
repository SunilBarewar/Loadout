"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  SkipForward,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  finishExerciseEarlyAction,
  logSetAction,
  reorderSessionExercisesAction,
  replaceExerciseAction,
  setCurrentExerciseAction,
  skipExerciseAction,
} from "@/features/sessions/actions";
import {
  countTerminalSets,
  formatLoggedSetLabel,
  formatTargetLabel,
} from "@/features/sessions/formatters";
import type { SerializedExercise, SessionPageData } from "@/features/sessions/schemas";
import {
  LogSetDialog,
  type SetDialogMode,
  type SetDialogSubmit,
} from "./log-set-dialog";

type SessionWorkoutProps = {
  data: SessionPageData;
};

type ExerciseDialogMode = "skip" | "replace" | "finish-early" | null;

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

function getActiveExercises(exercises: SerializedExercise[]) {
  return exercises
    .filter((exercise) => exercise.status !== "replaced")
    .sort((a, b) => a.position - b.position);
}

export function SessionWorkout({ data }: SessionWorkoutProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [setDialog, setSetDialog] = useState<{
    mode: SetDialogMode;
    setNumber: number;
  } | null>(null);
  const [exerciseDialog, setExerciseDialog] = useState<ExerciseDialogMode>(null);
  const [exerciseNotes, setExerciseNotes] = useState("");
  const [replacementName, setReplacementName] = useState("");
  const [replacementReason, setReplacementReason] = useState("");

  const { session, exercises, setLogsByExerciseId } = data;
  const isLive = session.status === "active" || session.status === "paused";
  const activeExercises = useMemo(() => getActiveExercises(exercises), [exercises]);

  const currentExercise =
    activeExercises.find(
      (exercise) => exercise.position === session.currentExercisePosition
    ) ?? activeExercises[0];

  const currentExerciseIndex = currentExercise
    ? activeExercises.findIndex((exercise) => exercise.id === currentExercise.id)
    : -1;

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

  const terminalSetCount = currentExercise
    ? countTerminalSets(currentLogs, currentExercise.targetSetsSnapshot)
    : 0;

  const canLogSets =
    isLive &&
    session.status === "active" &&
    currentExercise &&
    !["completed", "skipped", "replaced"].includes(currentExercise.status);

  const statusLabel =
    session.status === "completed"
      ? "COMPLETED"
      : session.status === "paused"
        ? "PAUSED"
        : session.status === "abandoned"
          ? "ABANDONED"
          : "LIVE WORKOUT";

  function refreshAfterMutation() {
    setSetDialog(null);
    setExerciseDialog(null);
    setExerciseNotes("");
    setReplacementName("");
    setReplacementReason("");
    router.refresh();
  }

  function runMutation(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      refreshAfterMutation();
    });
  }

  function handleSetSubmit(data: SetDialogSubmit) {
    if (!currentExercise || !setDialog) {
      return;
    }

    runMutation(async () =>
      logSetAction({
        sessionId: session.id,
        sessionExerciseId: currentExercise.id,
        setNumber: setDialog.setNumber,
        performedReps: data.performedReps,
        performedLoad: data.performedLoad,
        notes: data.notes,
        status: data.status,
      })
    );
  }

  function handleNavigate(position: number) {
    runMutation(async () =>
      setCurrentExerciseAction({
        sessionId: session.id,
        position,
      })
    );
  }

  function handleMoveExercise(direction: "up" | "down") {
    if (currentExerciseIndex < 0 || !isLive) {
      return;
    }

    const targetIndex =
      direction === "up" ? currentExerciseIndex - 1 : currentExerciseIndex + 1;
    if (targetIndex < 0 || targetIndex >= activeExercises.length) {
      return;
    }

    const nextOrder = [...activeExercises];
    const [moved] = nextOrder.splice(currentExerciseIndex, 1);
    nextOrder.splice(targetIndex, 0, moved);

    runMutation(async () =>
      reorderSessionExercisesAction({
        sessionId: session.id,
        orderedExerciseIds: nextOrder.map((exercise) => exercise.id),
      })
    );
  }

  function handleExerciseAction() {
    if (!currentExercise || !exerciseDialog) {
      return;
    }

    if (exerciseDialog === "skip") {
      runMutation(async () =>
        skipExerciseAction({
          sessionId: session.id,
          sessionExerciseId: currentExercise.id,
          notes: exerciseNotes.trim() || null,
        })
      );
      return;
    }

    if (exerciseDialog === "finish-early") {
      runMutation(async () =>
        finishExerciseEarlyAction({
          sessionId: session.id,
          sessionExerciseId: currentExercise.id,
          notes: exerciseNotes.trim() || null,
        })
      );
      return;
    }

    if (exerciseDialog === "replace") {
      runMutation(async () =>
        replaceExerciseAction({
          sessionId: session.id,
          sessionExerciseId: currentExercise.id,
          name: replacementName,
          reason: replacementReason.trim() || null,
        })
      );
    }
  }

  return (
    <>
      <div className="rounded-md border border-border bg-card p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="text-xs uppercase font-bold tracking-wider text-primary">
              {currentExercise
                ? `Exercise ${currentExerciseIndex + 1} of ${activeExercises.length}`
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
            {currentExercise?.notes && (
              <p className="text-xs text-foreground/80 mt-1">
                {currentExercise.notes}
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
          <>
            {canLogSets && (
              <div className="flex flex-wrap gap-2">
                {terminalSetCount > 0 &&
                  terminalSetCount < currentExercise.targetSetsSnapshot && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => {
                        setExerciseNotes("");
                        setExerciseDialog("finish-early");
                      }}
                      className="text-xs"
                    >
                      <SkipForward className="size-3.5" />
                      Finish early
                    </Button>
                  )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    setExerciseNotes("");
                    setExerciseDialog("skip");
                  }}
                  className="text-xs"
                >
                  Skip exercise
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    setReplacementName("");
                    setReplacementReason("");
                    setExerciseDialog("replace");
                  }}
                  className="text-xs"
                >
                  Replace
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {Array.from({ length: currentExercise.targetSetsSnapshot }).map(
                (_, index) => {
                  const setNumber = index + 1;
                  const loggedSet = currentLogs.find(
                    (log) => log.setNumber === setNumber
                  );
                  const isCurrent = canLogSets && setNumber === nextSetNumber;
                  const isSkipped = loggedSet?.status === "skipped";
                  const isFailed = loggedSet?.status === "failed";

                  return (
                    <div
                      key={setNumber}
                      className={`flex items-center justify-between p-3 rounded border text-sm gap-2 ${
                        isCurrent
                          ? "border-primary bg-primary/5"
                          : loggedSet
                            ? isSkipped
                              ? "border-muted-foreground/30 bg-muted/30"
                              : isFailed
                                ? "border-destructive/40 bg-destructive/5"
                                : "border-primary/40 bg-primary/5"
                            : "border-border bg-surface-2"
                      }`}
                    >
                      <span className="font-bold shrink-0">Set {setNumber}</span>
                      <span className="font-mono text-xs text-muted-foreground truncate flex-1 text-right">
                        {loggedSet
                          ? formatLoggedSetLabel(loggedSet)
                          : formatTargetLabel(currentExercise)}
                      </span>
                      {loggedSet ? (
                        <div className="flex items-center gap-1 shrink-0">
                          {isSkipped ? (
                            <span className="size-8 rounded flex items-center justify-center text-muted-foreground">
                              <SkipForward className="size-4" />
                            </span>
                          ) : isFailed ? (
                            <span className="size-8 rounded flex items-center justify-center text-destructive">
                              <X className="size-4" />
                            </span>
                          ) : (
                            <span className="size-8 rounded flex items-center justify-center text-primary">
                              <Check className="size-4" />
                            </span>
                          )}
                          {canLogSets && (
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              disabled={isPending}
                              onClick={() =>
                                setSetDialog({
                                  mode: "log",
                                  setNumber,
                                })
                              }
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          {canLogSets && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                disabled={!isCurrent || isPending}
                                onClick={() =>
                                  setSetDialog({ mode: "skip", setNumber })
                                }
                                className="text-xs px-2"
                              >
                                Skip
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button
                                      type="button"
                                      size="icon-sm"
                                      variant="ghost"
                                      disabled={!isCurrent || isPending}
                                    />
                                  }
                                >
                                  <MoreHorizontal className="size-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setSetDialog({ mode: "log", setNumber })
                                    }
                                  >
                                    Log with details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setSetDialog({ mode: "fail", setNumber })
                                    }
                                  >
                                    Log as failed
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button
                                type="button"
                                disabled={!isCurrent || isPending}
                                onClick={() =>
                                  runMutation(async () =>
                                    logSetAction({
                                      sessionId: session.id,
                                      sessionExerciseId: currentExercise.id,
                                      setNumber,
                                      performedReps:
                                        currentExercise.targetRepsMinSnapshot,
                                      performedLoad:
                                        currentExercise.targetLoadSnapshot,
                                    })
                                  )
                                }
                                className="size-8 rounded flex items-center justify-center font-bold text-xs transition-colors border border-border bg-background text-foreground hover:bg-primary hover:text-primary-foreground disabled:opacity-60 disabled:pointer-events-none"
                              >
                                {isPending && isCurrent ? "…" : "Log"}
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>

            {activeExercises.length > 1 && (
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={currentExerciseIndex <= 0 || isPending}
                  onClick={() =>
                    handleNavigate(activeExercises[currentExerciseIndex - 1].position)
                  }
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={
                    currentExerciseIndex < 0 ||
                    currentExerciseIndex >= activeExercises.length - 1 ||
                    isPending
                  }
                  onClick={() =>
                    handleNavigate(activeExercises[currentExerciseIndex + 1].position)
                  }
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </>
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

      {activeExercises.length > 0 && (
        <div className="rounded-md border border-border bg-card divide-y divide-border overflow-hidden">
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-surface-2">
            Exercises
          </div>
          {activeExercises.map((exercise, index) => {
            const logs = setLogsByExerciseId[exercise.id] ?? [];
            const progress = countTerminalSets(
              logs,
              exercise.targetSetsSnapshot
            );
            const isCurrent =
              exercise.position === session.currentExercisePosition;

            return (
              <div
                key={exercise.id}
                className={`flex items-center gap-2 px-4 py-3 text-sm ${
                  isCurrent ? "bg-primary/5" : ""
                }`}
              >
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleNavigate(exercise.position)}
                  className="flex-1 min-w-0 text-left disabled:opacity-60"
                >
                  <span className="font-medium text-foreground block truncate">
                    {index + 1}. {exercise.nameSnapshot}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {exercise.status.replace("_", " ")} · {progress}/
                    {exercise.targetSetsSnapshot} sets
                  </span>
                </button>

                {isLive && isCurrent && activeExercises.length > 1 && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      disabled={index === 0 || isPending}
                      onClick={() => handleMoveExercise("up")}
                      aria-label="Move exercise up"
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      disabled={
                        index === activeExercises.length - 1 || isPending
                      }
                      onClick={() => handleMoveExercise("down")}
                      aria-label="Move exercise down"
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {currentExercise && setDialog && (
        <LogSetDialog
          key={`${setDialog.setNumber}-${setDialog.mode}`}
          open={setDialog != null}
          onOpenChange={(open) => {
            if (!open) {
              setSetDialog(null);
            }
          }}
          mode={setDialog.mode}
          setNumber={setDialog.setNumber}
          exercise={currentExercise}
          existingLog={currentLogs.find(
            (log) => log.setNumber === setDialog.setNumber
          )}
          onSubmit={handleSetSubmit}
          isPending={isPending}
        />
      )}

      <Dialog
        open={exerciseDialog != null}
        onOpenChange={(open) => {
          if (!open) {
            setExerciseDialog(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {exerciseDialog === "skip"
                ? "Skip exercise?"
                : exerciseDialog === "replace"
                  ? "Replace exercise"
                  : "Finish exercise early?"}
            </DialogTitle>
            <DialogDescription>
              {exerciseDialog === "skip"
                ? "This exercise will be marked skipped. No sets will be logged."
                : exerciseDialog === "replace"
                  ? "The current exercise will be replaced for this session only."
                  : "Remaining sets will be marked skipped and the exercise completed."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {exerciseDialog === "replace" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="replacement-name">Replacement exercise</Label>
                  <Input
                    id="replacement-name"
                    value={replacementName}
                    onChange={(event) => setReplacementName(event.target.value)}
                    placeholder="e.g. Dumbbell bench press"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="replacement-reason">Reason (optional)</Label>
                  <Textarea
                    id="replacement-reason"
                    value={replacementReason}
                    onChange={(event) =>
                      setReplacementReason(event.target.value)
                    }
                    placeholder="e.g. bench rack was taken"
                    rows={2}
                  />
                </div>
              </>
            )}

            {exerciseDialog !== "replace" && (
              <div className="space-y-1.5">
                <Label htmlFor="exercise-notes">Notes (optional)</Label>
                <Textarea
                  id="exercise-notes"
                  value={exerciseNotes}
                  onChange={(event) => setExerciseNotes(event.target.value)}
                  placeholder="e.g. shoulder injury, ran out of time"
                  rows={2}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setExerciseDialog(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleExerciseAction}
              disabled={
                isPending ||
                (exerciseDialog === "replace" && !replacementName.trim())
              }
            >
              {isPending ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
