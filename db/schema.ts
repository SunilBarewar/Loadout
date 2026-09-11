import { relations, sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export const experienceLevelEnum = pgEnum("experience_level", [
  "beginner",
  "intermediate",
  "advanced",
]);

export const trainingGoalEnum = pgEnum("training_goal", [
  "hypertrophy",
  "strength",
  "fat_loss",
  "endurance",
  "general_fitness",
]);

export const weightUnitEnum = pgEnum("weight_unit", ["kg", "lb"]);

export const planStatusEnum = pgEnum("plan_status", [
  "draft",
  "saved",
  "active",
  "archived",
]);

export const sessionStatusEnum = pgEnum("session_status", [
  "active",
  "paused",
  "completed",
  "abandoned",
]);

export const sessionExerciseStatusEnum = pgEnum("session_exercise_status", [
  "pending",
  "in_progress",
  "completed",
  "skipped",
  "replaced",
]);

export const setStatusEnum = pgEnum("set_status", [
  "completed",
  "failed",
  "skipped",
]);

export const chatThreadPurposeEnum = pgEnum("chat_thread_purpose", [
  "onboarding",
  "planner",
  "plan_revision",
  "session_swap",
]);

export const chatRoleEnum = pgEnum("chat_role", [
  "user",
  "assistant",
  "system",
]);

// ---------------------------------------------------------------------------
// 1. Profile and Equipment
// ---------------------------------------------------------------------------

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(), // Clerk user ID (e.g. user_2abc123)
    displayName: text("display_name"),
    email: text("email"),
    experienceLevel: experienceLevelEnum("experience_level"),
    primaryGoal: trainingGoalEnum("primary_goal"),
    weightUnit: weightUnitEnum("weight_unit").default("lb").notNull(),
    defaultSessionMinutes: integer("default_session_minutes"),
    defaultDaysPerWeek: integer("default_days_per_week"),
    limitations: text("limitations"),
    customEquipmentNotes: text("custom_equipment_notes"),
    onboardingCompletedAt: timestamp("onboarding_completed_at", {
      withTimezone: true,
      mode: "date",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "users_default_session_minutes_check",
      sql`${table.defaultSessionMinutes} IS NULL OR (${table.defaultSessionMinutes} >= 10 AND ${table.defaultSessionMinutes} <= 240)`
    ),
    check(
      "users_default_days_per_week_check",
      sql`${table.defaultDaysPerWeek} IS NULL OR (${table.defaultDaysPerWeek} >= 1 AND ${table.defaultDaysPerWeek} <= 7)`
    ),
  ]
);

export const equipment = pgTable("equipment", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").unique().notNull(), // e.g. dumbbells, adjustable-bench
  name: text("name").notNull(),
  category: text("category").notNull(), // free_weight, machine, bodyweight, cardio
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const userEquipment = pgTable(
  "user_equipment",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    equipmentId: uuid("equipment_id")
      .notNull()
      .references(() => equipment.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.equipmentId],
    }),
  ]
);

// ---------------------------------------------------------------------------
// 2. Plans and Program Versions
// ---------------------------------------------------------------------------

export const workoutPlans = pgTable(
  "workout_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    status: planStatusEnum("status").default("draft").notNull(),
    goal: trainingGoalEnum("goal"),
    daysPerWeek: integer("days_per_week").notNull(),
    activeVersionId: uuid("active_version_id").references(
      (): AnyPgColumn => planVersions.id,
      { onDelete: "set null" }
    ),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "workout_plans_days_per_week_check",
      sql`${table.daysPerWeek} >= 1 AND ${table.daysPerWeek} <= 7`
    ),
    uniqueIndex("workout_plans_user_active_idx")
      .on(table.userId)
      .where(sql`${table.status} = 'active'`),
  ]
);

export const planVersions = pgTable(
  "plan_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => workoutPlans.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    changeSummary: text("change_summary"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("plan_versions_plan_id_version_number_unique").on(
      table.planId,
      table.versionNumber
    ),
  ]
);

export const planDays = pgTable(
  "plan_days",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    planVersionId: uuid("plan_version_id")
      .notNull()
      .references(() => planVersions.id, { onDelete: "cascade" }),
    dayNumber: integer("day_number").notNull(),
    scheduledWeekday: smallint("scheduled_weekday"), // 0 Sunday through 6 Saturday
    title: text("title").notNull(), // e.g. "Pull and biceps"
    focus: text("focus"),
    estimatedMinutes: integer("estimated_minutes"),
    instructions: text("instructions"),
    sortOrder: integer("sort_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "plan_days_scheduled_weekday_check",
      sql`${table.scheduledWeekday} IS NULL OR (${table.scheduledWeekday} >= 0 AND ${table.scheduledWeekday} <= 6)`
    ),
    unique("plan_days_version_day_number_unique").on(
      table.planVersionId,
      table.dayNumber
    ),
  ]
);

export const planExercises = pgTable(
  "plan_exercises",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    planDayId: uuid("plan_day_id")
      .notNull()
      .references(() => planDays.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    name: text("name").notNull(),
    primaryMuscleGroup: text("primary_muscle_group").notNull(),
    equipmentSlug: text("equipment_slug"),
    targetSets: integer("target_sets").notNull(),
    targetRepsMin: integer("target_reps_min").notNull(),
    targetRepsMax: integer("target_reps_max").notNull(),
    targetLoad: numeric("target_load", { precision: 8, scale: 2 }),
    weightUnit: weightUnitEnum("weight_unit"),
    restSeconds: integer("rest_seconds").notNull(),
    targetRpe: numeric("target_rpe", { precision: 3, scale: 1 }),
    formTips: text("form_tips"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("plan_exercises_day_position_unique").on(
      table.planDayId,
      table.position
    ),
    check("plan_exercises_target_sets_check", sql`${table.targetSets} >= 1`),
    check(
      "plan_exercises_target_reps_min_check",
      sql`${table.targetRepsMin} >= 1`
    ),
    check(
      "plan_exercises_target_reps_max_check",
      sql`${table.targetRepsMax} >= ${table.targetRepsMin}`
    ),
    check(
      "plan_exercises_rest_seconds_check",
      sql`${table.restSeconds} >= 0 AND ${table.restSeconds} <= 1800`
    ),
    check(
      "plan_exercises_target_rpe_check",
      sql`${table.targetRpe} IS NULL OR (${table.targetRpe} >= 1 AND ${table.targetRpe} <= 10)`
    ),
  ]
);

// ---------------------------------------------------------------------------
// 3. Workout Execution and History
// ---------------------------------------------------------------------------

export const workoutSessions = pgTable(
  "workout_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourcePlanId: uuid("source_plan_id").references(() => workoutPlans.id, {
      onDelete: "set null",
    }),
    sourcePlanVersionId: uuid("source_plan_version_id").references(
      () => planVersions.id,
      { onDelete: "set null" }
    ),
    sourcePlanDayId: uuid("source_plan_day_id").references(() => planDays.id, {
      onDelete: "set null",
    }),
    titleSnapshot: text("title_snapshot").notNull(),
    status: sessionStatusEnum("status").default("active").notNull(),
    currentExercisePosition: integer("current_exercise_position")
      .default(1)
      .notNull(),
    activeRestEndsAt: timestamp("active_rest_ends_at", {
      withTimezone: true,
      mode: "date",
    }),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true, mode: "date" }),
    notes: text("notes"),
    perceivedEffort: numeric("perceived_effort", { precision: 3, scale: 1 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "workout_sessions_perceived_effort_check",
      sql`${table.perceivedEffort} IS NULL OR (${table.perceivedEffort} >= 1 AND ${table.perceivedEffort} <= 10)`
    ),
    uniqueIndex("workout_sessions_user_active_paused_idx")
      .on(table.userId)
      .where(sql`${table.status} IN ('active', 'paused')`),
  ]
);

export const sessionExercises = pgTable(
  "session_exercises",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => workoutSessions.id, { onDelete: "cascade" }),
    sourcePlanExerciseId: uuid("source_plan_exercise_id").references(
      () => planExercises.id,
      { onDelete: "set null" }
    ),
    position: integer("position").notNull(),
    nameSnapshot: text("name_snapshot").notNull(),
    primaryMuscleSnapshot: text("primary_muscle_snapshot").notNull(),
    equipmentSnapshot: text("equipment_snapshot"),
    targetSetsSnapshot: integer("target_sets_snapshot").notNull(),
    targetRepsMinSnapshot: integer("target_reps_min_snapshot").notNull(),
    targetRepsMaxSnapshot: integer("target_reps_max_snapshot").notNull(),
    targetLoadSnapshot: numeric("target_load_snapshot", {
      precision: 8,
      scale: 2,
    }),
    weightUnitSnapshot: weightUnitEnum("weight_unit_snapshot"),
    restSecondsSnapshot: integer("rest_seconds_snapshot").notNull(),
    status: sessionExerciseStatusEnum("status").default("pending").notNull(),
    replacementReason: text("replacement_reason"),
    replacesSessionExerciseId: uuid("replaces_session_exercise_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("session_exercises_session_id_position_unique").on(
      table.sessionId,
      table.position
    ),
    foreignKey({
      columns: [table.replacesSessionExerciseId],
      foreignColumns: [table.id],
      name: "session_exercises_replaces_fk",
    }).onDelete("set null"),
  ]
);

export const setLogs = pgTable(
  "set_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionExerciseId: uuid("session_exercise_id")
      .notNull()
      .references(() => sessionExercises.id, { onDelete: "cascade" }),
    setNumber: integer("set_number").notNull(),
    plannedRepsMin: integer("planned_reps_min"),
    plannedRepsMax: integer("planned_reps_max"),
    performedReps: integer("performed_reps"),
    performedLoad: numeric("performed_load", { precision: 8, scale: 2 }),
    weightUnit: weightUnitEnum("weight_unit"),
    rpe: numeric("rpe", { precision: 3, scale: 1 }),
    status: setStatusEnum("status").default("completed").notNull(),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "date",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("set_logs_session_exercise_set_number_unique").on(
      table.sessionExerciseId,
      table.setNumber
    ),
    check(
      "set_logs_rpe_check",
      sql`${table.rpe} IS NULL OR (${table.rpe} >= 1 AND ${table.rpe} <= 10)`
    ),
  ]
);

// ---------------------------------------------------------------------------
// 4. Chat Persistence
// ---------------------------------------------------------------------------

export type ThreadPlanningFacts = {
  primaryGoal?:
    | "hypertrophy"
    | "strength"
    | "fat_loss"
    | "endurance"
    | "general_fitness";
  experienceLevel?: "beginner" | "intermediate" | "advanced";
  defaultDaysPerWeek?: number;
  defaultSessionMinutes?: number;
  equipmentSlugs?: string[];
  limitations?: string | null;
  limitationsConfirmedNone?: boolean;
  weightUnit?: "kg" | "lb";
  skipRemainingSlots?: boolean;
};

export const chatThreads = pgTable("chat_threads", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  purpose: chatThreadPurposeEnum("purpose").notNull(),
  relatedPlanId: uuid("related_plan_id").references(() => workoutPlans.id, {
    onDelete: "set null",
  }),
  relatedSessionId: uuid("related_session_id").references(
    () => workoutSessions.id,
    { onDelete: "set null" }
  ),
  planningFacts: jsonb("planning_facts").$type<ThreadPlanningFacts>(),
  title: text("title"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => chatThreads.id, { onDelete: "cascade" }),
  role: chatRoleEnum("role").notNull(),
  parts: jsonb("parts").notNull(), // Chat UI part registry envelope array
  model: text("model"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  userEquipment: many(userEquipment),
  workoutPlans: many(workoutPlans),
  workoutSessions: many(workoutSessions),
  chatThreads: many(chatThreads),
}));

export const equipmentRelations = relations(equipment, ({ many }) => ({
  userEquipment: many(userEquipment),
}));

export const userEquipmentRelations = relations(userEquipment, ({ one }) => ({
  user: one(users, {
    fields: [userEquipment.userId],
    references: [users.id],
  }),
  equipment: one(equipment, {
    fields: [userEquipment.equipmentId],
    references: [equipment.id],
  }),
}));

export const workoutPlansRelations = relations(
  workoutPlans,
  ({ one, many }) => ({
    user: one(users, {
      fields: [workoutPlans.userId],
      references: [users.id],
    }),
    activeVersion: one(planVersions, {
      fields: [workoutPlans.activeVersionId],
      references: [planVersions.id],
    }),
    versions: many(planVersions),
    sessions: many(workoutSessions),
    chatThreads: many(chatThreads),
  })
);

export const planVersionsRelations = relations(
  planVersions,
  ({ one, many }) => ({
    plan: one(workoutPlans, {
      fields: [planVersions.planId],
      references: [workoutPlans.id],
    }),
    days: many(planDays),
    sessions: many(workoutSessions),
  })
);

export const planDaysRelations = relations(planDays, ({ one, many }) => ({
  version: one(planVersions, {
    fields: [planDays.planVersionId],
    references: [planVersions.id],
  }),
  exercises: many(planExercises),
  sessions: many(workoutSessions),
}));

export const planExercisesRelations = relations(
  planExercises,
  ({ one, many }) => ({
    day: one(planDays, {
      fields: [planExercises.planDayId],
      references: [planDays.id],
    }),
    sessionExercises: many(sessionExercises),
  })
);

export const workoutSessionsRelations = relations(
  workoutSessions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [workoutSessions.userId],
      references: [users.id],
    }),
    sourcePlan: one(workoutPlans, {
      fields: [workoutSessions.sourcePlanId],
      references: [workoutPlans.id],
    }),
    sourcePlanVersion: one(planVersions, {
      fields: [workoutSessions.sourcePlanVersionId],
      references: [planVersions.id],
    }),
    sourcePlanDay: one(planDays, {
      fields: [workoutSessions.sourcePlanDayId],
      references: [planDays.id],
    }),
    exercises: many(sessionExercises),
    chatThreads: many(chatThreads),
  })
);

export const sessionExercisesRelations = relations(
  sessionExercises,
  ({ one, many }) => ({
    session: one(workoutSessions, {
      fields: [sessionExercises.sessionId],
      references: [workoutSessions.id],
    }),
    sourcePlanExercise: one(planExercises, {
      fields: [sessionExercises.sourcePlanExerciseId],
      references: [planExercises.id],
    }),
    replacesSessionExercise: one(sessionExercises, {
      fields: [sessionExercises.replacesSessionExerciseId],
      references: [sessionExercises.id],
      relationName: "exercise_replacements",
    }),
    replacedBy: many(sessionExercises, {
      relationName: "exercise_replacements",
    }),
    setLogs: many(setLogs),
  })
);

export const setLogsRelations = relations(setLogs, ({ one }) => ({
  sessionExercise: one(sessionExercises, {
    fields: [setLogs.sessionExerciseId],
    references: [sessionExercises.id],
  }),
}));

export const chatThreadsRelations = relations(
  chatThreads,
  ({ one, many }) => ({
    user: one(users, {
      fields: [chatThreads.userId],
      references: [users.id],
    }),
    relatedPlan: one(workoutPlans, {
      fields: [chatThreads.relatedPlanId],
      references: [workoutPlans.id],
    }),
    relatedSession: one(workoutSessions, {
      fields: [chatThreads.relatedSessionId],
      references: [workoutSessions.id],
    }),
    messages: many(chatMessages),
  })
);

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  thread: one(chatThreads, {
    fields: [chatMessages.threadId],
    references: [chatThreads.id],
  }),
}));

// ---------------------------------------------------------------------------
// Type Exports
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Equipment = typeof equipment.$inferSelect;
export type NewEquipment = typeof equipment.$inferInsert;

export type UserEquipment = typeof userEquipment.$inferSelect;
export type NewUserEquipment = typeof userEquipment.$inferInsert;

export type WorkoutPlan = typeof workoutPlans.$inferSelect;
export type NewWorkoutPlan = typeof workoutPlans.$inferInsert;

export type PlanVersion = typeof planVersions.$inferSelect;
export type NewPlanVersion = typeof planVersions.$inferInsert;

export type PlanDay = typeof planDays.$inferSelect;
export type NewPlanDay = typeof planDays.$inferInsert;

export type PlanExercise = typeof planExercises.$inferSelect;
export type NewPlanExercise = typeof planExercises.$inferInsert;

export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type NewWorkoutSession = typeof workoutSessions.$inferInsert;

export type SessionExercise = typeof sessionExercises.$inferSelect;
export type NewSessionExercise = typeof sessionExercises.$inferInsert;

export type SetLog = typeof setLogs.$inferSelect;
export type NewSetLog = typeof setLogs.$inferInsert;

export type ChatThread = typeof chatThreads.$inferSelect;
export type NewChatThread = typeof chatThreads.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;

export type ExperienceLevel = (typeof experienceLevelEnum.enumValues)[number];
export type TrainingGoal = (typeof trainingGoalEnum.enumValues)[number];
export type WeightUnit = (typeof weightUnitEnum.enumValues)[number];
export type PlanStatus = (typeof planStatusEnum.enumValues)[number];
export type SessionStatus = (typeof sessionStatusEnum.enumValues)[number];
export type SessionExerciseStatus =
  (typeof sessionExerciseStatusEnum.enumValues)[number];
export type SetStatus = (typeof setStatusEnum.enumValues)[number];
export type ChatThreadPurpose =
  (typeof chatThreadPurposeEnum.enumValues)[number];
export type ChatRole = (typeof chatRoleEnum.enumValues)[number];
