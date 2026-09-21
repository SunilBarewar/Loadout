"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Check, Dumbbell } from "lucide-react";
import { applyExerciseSwapFromChatAction } from "@/features/sessions/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { toast } from "@/components/ui/toast";
import type { ExerciseCarouselPartData } from "../schemas/exercise-carousel";

interface ExerciseCarouselCardProps {
  data: ExerciseCarouselPartData;
  threadId?: string;
}

export function ExerciseCarouselCard({ data, threadId }: ExerciseCarouselCardProps) {
  const router = useRouter();
  const [appliedId, setAppliedId] = useState<string | null>(
    data.appliedAlternativeId ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setAppliedId(data.appliedAlternativeId ?? null);
  }, [data.appliedAlternativeId]);

  const hasApplied = appliedId != null;

  function handleApply(alternativeId: string, exerciseName: string) {
    if (hasApplied) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await applyExerciseSwapFromChatAction({
        sessionId: data.sessionId,
        sessionExerciseId: data.sessionExerciseId,
        exerciseName,
        reason: data.reason,
        threadId,
      });

      if (!result.ok) {
        setError(result.error);
        toast.add({
          type: "error",
          title: "Could not swap exercise",
          description: result.error,
        });
        return;
      }

      setAppliedId(alternativeId);
      toast.add({
        type: "success",
        title: "Exercise swapped",
        description: `${data.originalExerciseName} → ${exerciseName}`,
      });
      router.refresh();
    });
  }

  return (
    <Card className="w-full border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="size-4 text-primary" />
          <CardTitle className="text-base font-display">
            Swap suggestions
          </CardTitle>
          {hasApplied && (
            <Badge variant="secondary" className="ml-auto">
              <Check className="size-3" />
              Applied to session
            </Badge>
          )}
        </div>
        <CardDescription>
          Replacing{" "}
          <span className="font-medium text-foreground">
            {data.originalExerciseName}
          </span>
          {data.reason ? ` — ${data.reason}` : ""}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Carousel opts={{ align: "start" }} className="w-full">
          <CarouselContent className="-ml-2">
            {data.alternatives.map((alternative) => {
              const isSelected = appliedId === alternative.id;

              return (
                <CarouselItem
                  key={alternative.id}
                  className="pl-2 basis-full sm:basis-1/2"
                >
                  <div className="h-full rounded-md border border-border bg-surface-2 p-4 flex flex-col gap-3">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground leading-snug">
                          {alternative.name}
                        </h3>
                        {isSelected && (
                          <Badge variant="secondary" className="shrink-0">
                            <Check className="size-3" />
                            Selected
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">
                        {alternative.primaryMuscle}
                        {alternative.equipmentSlug
                          ? ` · ${alternative.equipmentSlug.replace(/-/g, " ")}`
                          : ""}
                      </p>
                    </div>

                    <p className="text-sm text-foreground/85 flex-1">
                      {alternative.rationale}
                    </p>

                    <p className="text-xs font-mono text-muted-foreground">
                      {alternative.targetSets} × {alternative.targetRepsMin}-
                      {alternative.targetRepsMax}
                      {alternative.targetLoad
                        ? ` @ ${alternative.targetLoad}${alternative.weightUnit ?? ""}`
                        : ""}
                    </p>

                    <Button
                      type="button"
                      size="sm"
                      disabled={isPending || hasApplied}
                      onClick={() =>
                        handleApply(alternative.id, alternative.name)
                      }
                      className="w-full"
                    >
                      {isSelected ? (
                        <>
                          <Check className="size-3.5" />
                          Swapped in session
                        </>
                      ) : hasApplied ? (
                        <>Unavailable</>
                      ) : (
                        <>
                          <Dumbbell className="size-3.5" />
                          Use this exercise
                        </>
                      )}
                    </Button>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          {data.alternatives.length > 1 && (
            <>
              <CarouselPrevious className="left-0" />
              <CarouselNext className="right-0" />
            </>
          )}
        </Carousel>
      </CardContent>

      {error && (
        <CardFooter className="pt-0">
          <p className="text-xs text-destructive">{error}</p>
        </CardFooter>
      )}
    </Card>
  );
}
