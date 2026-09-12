import Link from "next/link";
import { ArrowLeft, Dumbbell } from "lucide-react";
import type { EquipmentPageData } from "@/features/settings/schemas";
import { EquipmentForm } from "./equipment-form";

type EquipmentPageContentProps = {
  data: EquipmentPageData;
};

export function EquipmentPageContent({ data }: EquipmentPageContentProps) {
  return (
    <div className="w-full max-w-295 mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      <div className="space-y-4 pb-2 border-b border-border">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to settings
        </Link>
        <div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground">
            EQUIPMENT & UNITS
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Select what you have access to and how weights are displayed.
          </p>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
          <Dumbbell className="size-4 text-primary" />
          <span>Your gym setup</span>
        </div>

        <EquipmentForm data={data} />
      </div>
    </div>
  );
}
