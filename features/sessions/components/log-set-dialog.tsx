"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import type { SerializedExercise, SerializedSetLog } from "@/features/sessions/schemas";

export type SetDialogMode = "log" | "skip" | "fail";

export type SetDialogSubmit = {
  status: "completed" | "failed" | "skipped";
  performedReps?: number | null;
  performedLoad?: string | null;
  notes?: string | null;
};

type LogSetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: SetDialogMode;
  setNumber: number;
  exercise: SerializedExercise;
  existingLog?: SerializedSetLog;
  onSubmit: (data: SetDialogSubmit) => void;
  isPending: boolean;
};

export function LogSetDialog({
  open,
  onOpenChange,
  mode,
  setNumber,
  exercise,
  existingLog,
  onSubmit,
  isPending,
}: LogSetDialogProps) {
  const [reps, setReps] = useState(
    String(existingLog?.performedReps ?? exercise.targetRepsMinSnapshot)
  );
  const [load, setLoad] = useState(
    existingLog?.performedLoad ?? exercise.targetLoadSnapshot ?? ""
  );
  const [notes, setNotes] = useState(existingLog?.notes ?? "");

  function handleSubmit() {
    if (mode === "skip") {
      onSubmit({
        status: "skipped",
        notes: notes.trim() || null,
      });
      return;
    }

    if (mode === "fail") {
      onSubmit({
        status: "failed",
        performedReps: reps ? Number(reps) : null,
        performedLoad: load ? load : null,
        notes: notes.trim() || null,
      });
      return;
    }

    onSubmit({
      status: "completed",
      performedReps: Number(reps),
      performedLoad: load ? load : null,
      notes: notes.trim() || null,
    });
  }

  const title =
    mode === "skip"
      ? `Skip set ${setNumber}`
      : mode === "fail"
        ? `Log failed set ${setNumber}`
        : existingLog
          ? `Edit set ${setNumber}`
          : `Log set ${setNumber}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{exercise.nameSnapshot}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {mode !== "skip" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="set-reps">Reps</Label>
                <Input
                  id="set-reps"
                  type="number"
                  min={mode === "log" ? 1 : 0}
                  value={reps}
                  onChange={(event) => setReps(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="set-load">
                  Load ({exercise.weightUnitSnapshot ?? "lb"})
                </Label>
                <Input
                  id="set-load"
                  type="number"
                  min={0}
                  step="0.5"
                  value={load}
                  onChange={(event) => setLoad(event.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="set-notes">Notes (optional)</Label>
            <Textarea
              id="set-notes"
              placeholder={
                mode === "skip"
                  ? "e.g. shoulder pain, equipment taken"
                  : "e.g. felt heavy, shortened range"
              }
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving…" : mode === "skip" ? "Skip set" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
