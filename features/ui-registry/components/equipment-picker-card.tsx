"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Dumbbell } from "lucide-react";
import { saveUserEquipmentSelectionAction } from "@/features/planner/actions";
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
import { cn } from "@/lib/utils";
import type { EquipmentPickerPartData } from "../schemas/equipment-picker";

interface EquipmentPickerCardProps {
  data: EquipmentPickerPartData;
  threadId?: string;
}

export function EquipmentPickerCard({ data, threadId }: EquipmentPickerCardProps) {
  const router = useRouter();
  const [selectedSlugs, setSelectedSlugs] = useState(data.selectedSlugs);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const savedSlugsKey = data.selectedSlugs.slice().sort().join("|");

  useEffect(() => {
    setSelectedSlugs(data.selectedSlugs);
  }, [savedSlugsKey]);

  const selectedSet = new Set(selectedSlugs);
  const canSave = Boolean(threadId) && data.availableEquipment.length > 0;

  function toggleSlug(slug: string) {
    setSaved(false);
    setError(null);
    setSelectedSlugs((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug]
    );
  }

  function handleSave() {
    if (!threadId) {
      setError("This picker is missing thread context. Refresh and try again.");
      return;
    }

    if (selectedSlugs.length === 0) {
      setError("Select at least one piece of equipment.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await saveUserEquipmentSelectionAction(
        threadId,
        selectedSlugs
      );

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSelectedSlugs(result.slugs);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="size-4 text-primary" />
          Select your equipment
        </CardTitle>
        <CardDescription>
          {data.selectionMode === "onboarding"
            ? "Tap what you have available, then save your selection."
            : "Update the equipment available for your workouts."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.availableEquipment.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Equipment catalog is empty. Run{" "}
            <code className="text-xs">npm run db:seed:equipment</code> and refresh
            this thread.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.availableEquipment.map((item) => {
              const isSelected = selectedSet.has(item.slug);
              return (
                <button
                  key={item.slug}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={isPending}
                  onClick={() => toggleSlug(item.slug)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface-2 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        )}
        {data.allowCustomNotes && (
          <p className="text-xs text-muted-foreground">
            You can add custom equipment notes in your profile settings.
          </p>
        )}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {selectedSet.size} of {data.availableEquipment.length} selected
          </Badge>
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs text-primary">
              <Check className="size-3.5" />
              Saved
            </span>
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
      {canSave && (
        <CardFooter>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending || selectedSlugs.length === 0}
          >
            {isPending ? "Saving…" : "Save equipment"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
