"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { updateSettingsAction } from "@/features/settings/actions";
import type { SettingsPageData } from "@/features/settings/schemas";

type PreferencesFormProps = {
  data: SettingsPageData;
};

const goalOptions = [
  { value: "", label: "Not set" },
  { value: "hypertrophy", label: "Hypertrophy" },
  { value: "strength", label: "Strength" },
  { value: "fat_loss", label: "Fat loss" },
  { value: "endurance", label: "Endurance" },
  { value: "general_fitness", label: "General fitness" },
] as const;

const experienceOptions = [
  { value: "", label: "Not set" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

export function PreferencesForm({ data }: PreferencesFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [primaryGoal, setPrimaryGoal] = useState(data.primaryGoal ?? "");
  const [experienceLevel, setExperienceLevel] = useState(
    data.experienceLevel ?? ""
  );
  const [defaultDaysPerWeek, setDefaultDaysPerWeek] = useState(
    data.defaultDaysPerWeek?.toString() ?? ""
  );
  const [defaultSessionMinutes, setDefaultSessionMinutes] = useState(
    data.defaultSessionMinutes?.toString() ?? ""
  );
  const [limitations, setLimitations] = useState(data.limitations ?? "");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const days = defaultDaysPerWeek.trim()
      ? Number.parseInt(defaultDaysPerWeek, 10)
      : null;
    const minutes = defaultSessionMinutes.trim()
      ? Number.parseInt(defaultSessionMinutes, 10)
      : null;

    if (days !== null && (days < 1 || days > 7)) {
      setError("Days per week must be between 1 and 7.");
      return;
    }

    if (minutes !== null && (minutes < 10 || minutes > 240)) {
      setError("Session length must be between 10 and 240 minutes.");
      return;
    }

    startTransition(async () => {
      const result = await updateSettingsAction({
        primaryGoal: primaryGoal ? (primaryGoal as SettingsPageData["primaryGoal"]) : null,
        experienceLevel: experienceLevel
          ? (experienceLevel as SettingsPageData["experienceLevel"])
          : null,
        defaultDaysPerWeek: days,
        defaultSessionMinutes: minutes,
        limitations: limitations.trim() ? limitations.trim() : null,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primary-goal">Primary goal</Label>
          <NativeSelect
            id="primary-goal"
            className="w-full"
            value={primaryGoal}
            disabled={isPending}
            onChange={(event) => setPrimaryGoal(event.target.value)}
          >
            {goalOptions.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience-level">Experience level</Label>
          <NativeSelect
            id="experience-level"
            className="w-full"
            value={experienceLevel}
            disabled={isPending}
            onChange={(event) => setExperienceLevel(event.target.value)}
          >
            {experienceOptions.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-2">
          <Label htmlFor="days-per-week">Default days per week</Label>
          <Input
            id="days-per-week"
            type="number"
            min={1}
            max={7}
            placeholder="e.g. 4"
            value={defaultDaysPerWeek}
            disabled={isPending}
            onChange={(event) => setDefaultDaysPerWeek(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="session-minutes">Default session length (minutes)</Label>
          <Input
            id="session-minutes"
            type="number"
            min={10}
            max={240}
            placeholder="e.g. 60"
            value={defaultSessionMinutes}
            disabled={isPending}
            onChange={(event) => setDefaultSessionMinutes(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="limitations">Limitations or injuries</Label>
        <Textarea
          id="limitations"
          placeholder="e.g. Avoid heavy overhead pressing due to shoulder impingement."
          value={limitations}
          disabled={isPending}
          onChange={(event) => setLimitations(event.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save preferences"}
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
