import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { ensureCurrentUser } from "@/features/users";
import { getSessionWithExercises } from "@/features/sessions";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formatTarget(exercise: {
  targetSetsSnapshot: number;
  targetRepsMinSnapshot: number;
  targetRepsMaxSnapshot: number;
  targetLoadSnapshot: string | null;
  weightUnitSnapshot: "kg" | "lb" | null;
}): string {
  const reps =
    exercise.targetRepsMinSnapshot === exercise.targetRepsMaxSnapshot
      ? `${exercise.targetRepsMinSnapshot}`
      : `${exercise.targetRepsMinSnapshot}–${exercise.targetRepsMaxSnapshot}`;

  const load =
    exercise.targetLoadSnapshot != null
      ? ` · ${exercise.targetLoadSnapshot} ${exercise.weightUnitSnapshot ?? "lb"}`
      : "";

  return `${exercise.targetSetsSnapshot} sets × ${reps} reps${load}`;
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await ensureCurrentUser();
  if (!user) {
    notFound();
  }

  const { id } = await params;
  if (!uuidPattern.test(id)) {
    notFound();
  }

  const loaded = await getSessionWithExercises(id, user.id);
  if (!loaded) {
    notFound();
  }

  const { session, exercises } = loaded;
  const currentPosition = session.currentExercisePosition;
  const currentExercise =
    exercises.find((exercise) => exercise.position === currentPosition) ??
    exercises[0];

  const statusLabel =
    session.status === "completed"
      ? "COMPLETED"
      : session.status === "paused"
        ? "PAUSED"
        : "LIVE WORKOUT";

  return (
    <div className="w-full max-w-[720px] mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <Link
          href="/today"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Exit to Today</span>
        </Link>
        <span className="text-xs font-mono text-primary font-bold">
          {statusLabel}
        </span>
      </div>

      <div className="rounded-md border border-border bg-card p-6 space-y-6">
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
              Target: {formatTarget(currentExercise)}
            </p>
          )}
        </div>

        {currentExercise && (
          <div className="space-y-2">
            {Array.from({ length: currentExercise.targetSetsSnapshot }).map(
              (_, index) => {
                const setNumber = index + 1;
                const isCurrent = setNumber === 1 && session.status === "active";

                return (
                  <div
                    key={setNumber}
                    className={`flex items-center justify-between p-3 rounded border text-sm ${
                      isCurrent
                        ? "border-primary bg-primary/5"
                        : "border-border bg-surface-2"
                    }`}
                  >
                    <span className="font-bold">Set {setNumber}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatTarget(currentExercise)}
                    </span>
                    <button
                      type="button"
                      disabled
                      className={`size-8 rounded flex items-center justify-center font-bold text-xs transition-colors border border-border text-muted-foreground opacity-60`}
                    >
                      Log
                    </button>
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
    </div>
  );
}
