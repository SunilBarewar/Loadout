import type { PlanDay } from "@/db";
import type { schedulingModeSchema } from "./schemas";
import type { z } from "zod";

export type SchedulingMode = z.infer<typeof schedulingModeSchema>;

export function inferSchedulingMode(
  days: PlanDay[],
  daysPerWeek: number
): SchedulingMode {
  if (days.length === 0) {
    return "flexible_sequence";
  }

  const allHaveWeekday = days.every((day) => day.scheduledWeekday != null);
  if (allHaveWeekday && days.length === daysPerWeek) {
    return "fixed_weekdays";
  }

  return "flexible_sequence";
}

export function resolvePlanDayForDate(params: {
  days: PlanDay[];
  schedulingMode: SchedulingMode;
  referenceDate: Date;
  lastCompletedDayNumber?: number | null;
}): PlanDay | null {
  const sortedDays = [...params.days].sort((a, b) => a.dayNumber - b.dayNumber);
  if (sortedDays.length === 0) {
    return null;
  }

  if (params.schedulingMode === "fixed_weekdays") {
    const weekday = params.referenceDate.getDay();
    return (
      sortedDays.find((day) => day.scheduledWeekday === weekday) ?? null
    );
  }

  const lastDayNumber = params.lastCompletedDayNumber ?? 0;
  const nextDayNumber =
    lastDayNumber <= 0
      ? sortedDays[0].dayNumber
      : (sortedDays.find((day) => day.dayNumber > lastDayNumber)?.dayNumber ??
        sortedDays[0].dayNumber);

  return (
    sortedDays.find((day) => day.dayNumber === nextDayNumber) ??
    sortedDays[0]
  );
}

export function resolveTomorrowPlanDay(params: {
  days: PlanDay[];
  schedulingMode: SchedulingMode;
  referenceDate: Date;
  todayPlanDay: PlanDay | null;
  lastCompletedDayNumber?: number | null;
}): PlanDay | null {
  const sortedDays = [...params.days].sort((a, b) => a.dayNumber - b.dayNumber);
  if (sortedDays.length === 0) {
    return null;
  }

  const tomorrow = new Date(params.referenceDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (params.schedulingMode === "fixed_weekdays") {
    const weekday = tomorrow.getDay();
    return sortedDays.find((day) => day.scheduledWeekday === weekday) ?? null;
  }

  const anchorDay = params.todayPlanDay ?? sortedDays[0];
  const anchorIndex = sortedDays.findIndex((day) => day.id === anchorDay.id);
  if (anchorIndex === -1) {
    return sortedDays[0];
  }

  return sortedDays[(anchorIndex + 1) % sortedDays.length];
}
