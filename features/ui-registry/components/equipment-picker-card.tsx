"use client";

import { Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { EquipmentPickerPartData } from "../schemas/equipment-picker";

interface EquipmentPickerCardProps {
  data: EquipmentPickerPartData;
}

export function EquipmentPickerCard({ data }: EquipmentPickerCardProps) {
  const selectedSet = new Set(data.selectedSlugs);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="size-4 text-primary" />
          Select your equipment
        </CardTitle>
        <CardDescription>
          {data.selectionMode === "onboarding"
            ? "Tell Loadout what you have available at home or the gym."
            : "Update the equipment available for your workouts."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {data.availableEquipment.map((item) => {
            const isSelected = selectedSet.has(item.slug);
            return (
              <Badge
                key={item.slug}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "px-2.5 py-1 text-xs",
                  !isSelected && "text-muted-foreground"
                )}
              >
                {item.name}
              </Badge>
            );
          })}
        </div>
        {data.allowCustomNotes && (
          <p className="text-xs text-muted-foreground">
            You can add custom equipment notes in your profile settings.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {selectedSet.size} of {data.availableEquipment.length} selected
        </p>
      </CardContent>
    </Card>
  );
}
