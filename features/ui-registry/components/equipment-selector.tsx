"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EquipmentPickerPartData } from "../schemas/equipment-picker";

type EquipmentSelectorProps = {
  availableEquipment: EquipmentPickerPartData["availableEquipment"];
  selectedSlugs: string[];
  onToggle: (slug: string) => void;
  disabled?: boolean;
};

export function EquipmentSelector({
  availableEquipment,
  selectedSlugs,
  onToggle,
  disabled = false,
}: EquipmentSelectorProps) {
  const selectedSet = new Set(selectedSlugs);

  if (availableEquipment.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Equipment catalog is empty. Run{" "}
        <code className="text-xs">npm run db:seed:equipment</code> and refresh.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {availableEquipment.map((item) => {
          const isSelected = selectedSet.has(item.slug);
          return (
            <button
              key={item.slug}
              type="button"
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => onToggle(item.slug)}
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
      <Badge variant="secondary" className="text-xs">
        {selectedSet.size} of {availableEquipment.length} selected
      </Badge>
    </div>
  );
}
