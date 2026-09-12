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

export type EndSessionMode = "complete" | "abandon";

export type LogSetInput = {
  sessionId: string;
  sessionExerciseId: string;
  setNumber: number;
  performedReps: number;
  performedLoad?: string | null;
  rpe?: string | null;
  status?: "completed" | "failed" | "skipped";
};

export type LogSetResult = {
  exerciseCompleted: boolean;
  sessionCompleted: boolean;
  nextSetNumber: number | null;
  activeRestEndsAt: string | null;
};

export type HistorySessionItem = {
  id: string;
  dateLabel: string;
  title: string;
  setCount: number;
  durationLabel: string;
  status: "completed" | "abandoned";
};

export type HistoryPageData = {
  items: HistorySessionItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export type SerializedSession = {
  id: string;
  status: "active" | "paused" | "completed" | "abandoned";
  currentExercisePosition: number;
  activeRestEndsAt: string | null;
  startedAt: string;
  endedAt: string | null;
  titleSnapshot: string;
};

export type SerializedExercise = {
  id: string;
  position: number;
  nameSnapshot: string;
  targetSetsSnapshot: number;
  targetRepsMinSnapshot: number;
  targetRepsMaxSnapshot: number;
  targetLoadSnapshot: string | null;
  weightUnitSnapshot: "kg" | "lb" | null;
  restSecondsSnapshot: number;
  status: "pending" | "in_progress" | "completed" | "skipped" | "replaced";
};

export type SerializedSetLog = {
  id: string;
  sessionExerciseId: string;
  setNumber: number;
  performedReps: number | null;
  performedLoad: string | null;
  weightUnit: "kg" | "lb" | null;
  status: "completed" | "failed" | "skipped";
  completedAt: string | null;
};

export type SessionPageData = {
  session: SerializedSession;
  exercises: SerializedExercise[];
  setLogsByExerciseId: Record<string, SerializedSetLog[]>;
};

export type ActiveSessionHeaderData = {
  id: string;
  status: "active" | "paused";
  startedAt: string;
};

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
