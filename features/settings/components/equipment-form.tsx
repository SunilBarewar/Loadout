"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { EquipmentSelector } from "@/features/ui-registry/components/equipment-selector";
import { saveEquipmentAction } from "@/features/settings/actions";
import type { EquipmentPageData } from "@/features/settings/schemas";

type EquipmentFormProps = {
  data: EquipmentPageData;
};

export function EquipmentForm({ data }: EquipmentFormProps) {
  const router = useRouter();
  const [selectedSlugs, setSelectedSlugs] = useState(data.equipmentPicker.selectedSlugs);
  const [customEquipmentNotes, setCustomEquipmentNotes] = useState(
    data.customEquipmentNotes ?? ""
  );
  const [weightUnit, setWeightUnit] = useState(data.weightUnit);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const savedSlugsKey = data.equipmentPicker.selectedSlugs.slice().sort().join("|");

  useEffect(() => {
    setSelectedSlugs(data.equipmentPicker.selectedSlugs);
    setCustomEquipmentNotes(data.customEquipmentNotes ?? "");
    setWeightUnit(data.weightUnit);
  }, [savedSlugsKey, data.customEquipmentNotes, data.weightUnit]);

  function toggleSlug(slug: string) {
    setSaved(false);
    setError(null);
    setSelectedSlugs((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug]
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedSlugs.length === 0) {
      setError("Select at least one piece of equipment.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await saveEquipmentAction({
        equipmentSlugs: selectedSlugs,
        customEquipmentNotes: customEquipmentNotes.trim()
          ? customEquipmentNotes.trim()
          : null,
        weightUnit,
      });

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <Label>Available equipment</Label>
        <EquipmentSelector
          availableEquipment={data.equipmentPicker.availableEquipment}
          selectedSlugs={selectedSlugs}
          onToggle={toggleSlug}
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-equipment-notes">Custom equipment notes</Label>
        <Textarea
          id="custom-equipment-notes"
          placeholder="e.g. Dumbbells up to 40kg, cable tower on the far wall."
          value={customEquipmentNotes}
          disabled={isPending}
          onChange={(event) => {
            setSaved(false);
            setCustomEquipmentNotes(event.target.value);
          }}
        />
      </div>

      <div className="space-y-2">
        <Label>Weight unit</Label>
        <div className="flex gap-2">
          {(["kg", "lb"] as const).map((unit) => (
            <button
              key={unit}
              type="button"
              disabled={isPending}
              onClick={() => {
                setSaved(false);
                setWeightUnit(unit);
              }}
              className={cn(
                "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                weightUnit === unit
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface-2 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {unit === "kg" ? "Kilograms (kg)" : "Pounds (lb)"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending || selectedSlugs.length === 0}>
          {isPending ? "Saving…" : "Save equipment & units"}
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs text-primary">
            <Check className="size-3.5" />
            Saved
          </span>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}
