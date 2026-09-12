import Link from "next/link";
import { ArrowRight, Dumbbell, Sliders, User } from "lucide-react";
import type { SettingsPageData } from "@/features/settings/schemas";
import {
  formatExperienceLabel,
  formatGoalLabel,
  formatWeightUnitLabel,
} from "@/features/settings/formatters";
import { PreferencesForm } from "./preferences-form";

type SettingsPageContentProps = {
  data: SettingsPageData;
};

export function SettingsPageContent({ data }: SettingsPageContentProps) {
  const goalLabel = formatGoalLabel(data.primaryGoal);
  const experienceLabel = formatExperienceLabel(data.experienceLevel);

  return (
    <div className="w-full max-w-295 mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      <div className="pb-2 border-b border-border">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground">
          SETTINGS
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage training preferences, limitations, and account details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/settings/equipment"
          className="rounded-md border border-border bg-card p-6 space-y-3 transition-colors hover:border-primary/30 hover:bg-surface-2/40"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <Dumbbell className="size-4 text-primary" />
              <span>Equipment & Units</span>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground line-clamp-3">
            {data.equipmentSummary}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatWeightUnitLabel(data.weightUnit)}
            {data.selectedEquipmentCount > 0
              ? ` · ${data.selectedEquipmentCount} items selected`
              : ""}
          </p>
        </Link>

        <div className="rounded-md border border-border bg-card p-6 space-y-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <User className="size-4 text-primary" />
            <span>Account</span>
          </div>
          <p className="text-sm text-foreground font-medium">
            {data.displayName ?? "Lifter"}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.email ?? "No email on file"}
          </p>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-6 space-y-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Sliders className="size-4 text-primary" />
            <span>Training preferences</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {goalLabel && experienceLabel
              ? `${goalLabel} · ${experienceLabel}`
              : "Defaults used when planning new routines with the AI coach."}
          </p>
        </div>

        <PreferencesForm data={data} />
      </div>
    </div>
  );
}
