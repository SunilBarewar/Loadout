export type TodayExercisePreview = {
  position: number;
  orderLabel: string;
  name: string;
  targetLabel: string;
  loadLabel: string | null;
  restLabel: string;
};

export type TodaySessionState =
  | { kind: "none" }
  | {
      kind: "active" | "paused";
      sessionId: string;
      matchesTodayPlanDay: boolean;
    }
  | { kind: "completed_today"; sessionId: string };

export type TodayPageData = {
  dateLabel: string;
  hasActivePlan: boolean;
  adherence: {
    dayLabel: string;
    completedThisWeek: number;
    plannedThisWeek: number;
  } | null;
  workout: {
    planId: string;
    planDayId: string;
    planTitle: string;
    planGoalLabel: string | null;
    dayTitle: string;
    focus: string | null;
    estimatedMinutes: number | null;
    exerciseCount: number;
    totalSets: number;
    exercises: TodayExercisePreview[];
    equipmentLabel: string | null;
  } | null;
  isRestDay: boolean;
  session: TodaySessionState;
  stats: {
    weeklySessionCount: number;
    weeklyVolume: number;
    volumeUnit: "kg" | "lb";
    volumeChangePercent: number | null;
    streakDescription: string;
  };
  tomorrow: {
    title: string;
    subtitle: string;
  } | null;
};
