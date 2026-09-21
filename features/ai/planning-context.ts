import type { ChatThread, ThreadPlanningFacts, User } from "@/db/schema";
import type { Equipment } from "@/db/schema";
import type { PlanSummaryForContext } from "@/features/plans/repository";
import {
  trainingSummaryForPrompt,
  type SessionContextForPrompt,
  type TrainingSummaryForPrompt,
} from "./training-context";

export type PlanningSlot =
  | "goal"
  | "experience"
  | "days"
  | "minutes"
  | "equipment"
  | "limitations";

export type MergedPlanningFacts = {
  primaryGoal: ThreadPlanningFacts["primaryGoal"] | null;
  experienceLevel: ThreadPlanningFacts["experienceLevel"] | null;
  defaultDaysPerWeek: number | null;
  defaultSessionMinutes: number | null;
  equipmentSlugs: string[];
  limitations: string | null;
  limitationsConfirmedNone: boolean;
  weightUnit: "kg" | "lb";
  skipRemainingSlots: boolean;
};

export type PlanningContext = {
  purpose: ChatThread["purpose"];
  relatedPlanId: string | null;
  relatedSessionId: string | null;
  activePlanSummary: PlanSummaryForContext | null;
  trainingSummary: TrainingSummaryForPrompt | null;
  sessionContext: SessionContextForPrompt | null;
  threadSummary: string | null;
  profile: Pick<
    User,
    | "id"
    | "primaryGoal"
    | "experienceLevel"
    | "defaultDaysPerWeek"
    | "defaultSessionMinutes"
    | "limitations"
    | "weightUnit"
    | "customEquipmentNotes"
  >;
  equipmentSlugs: string[];
  equipmentCatalog: Equipment[];
  threadFacts: ThreadPlanningFacts;
  latestUserMessage: string | null;
  merged: MergedPlanningFacts;
  missingSlots: PlanningSlot[];
  allowPropose: boolean;
};

export const PLANNING_SAFE_DEFAULTS: MergedPlanningFacts = {
  primaryGoal: "general_fitness",
  experienceLevel: "beginner",
  defaultDaysPerWeek: 3,
  defaultSessionMinutes: 45,
  equipmentSlugs: ["bodyweight"],
  limitations: null,
  limitationsConfirmedNone: true,
  weightUnit: "lb",
  skipRemainingSlots: true,
};

const SKIP_PHRASE_PATTERNS = [
  /\bjust\s+(pick|build|choose|make)\b/i,
  /\byou\s+choose\b/i,
  /\bsurprise\s+me\b/i,
  /\buse\s+your\s+best\s+judg(?:e)?ment\b/i,
  /\bwhatever\s+works\b/i,
  /\bgo\s+ahead\b/i,
  /\bstop\s+asking\b/i,
];

export function detectSkipRemainingSlots(message: string | null): boolean {
  if (!message?.trim()) {
    return false;
  }

  return SKIP_PHRASE_PATTERNS.some((pattern) => pattern.test(message));
}

function mergePlanningFacts(params: {
  profile: PlanningContext["profile"];
  equipmentSlugs: string[];
  threadFacts: ThreadPlanningFacts;
  skipFromMessage: boolean;
}): MergedPlanningFacts {
  const { profile, equipmentSlugs, threadFacts, skipFromMessage } = params;

  const mergedEquipment =
    threadFacts.equipmentSlugs ??
    (equipmentSlugs.length > 0 ? equipmentSlugs : []);

  const limitationsConfirmedNone =
    threadFacts.limitationsConfirmedNone === true ||
    (threadFacts.limitations === null && profile.limitations !== null);

  return {
    primaryGoal: threadFacts.primaryGoal ?? profile.primaryGoal ?? null,
    experienceLevel:
      threadFacts.experienceLevel ?? profile.experienceLevel ?? null,
    defaultDaysPerWeek:
      threadFacts.defaultDaysPerWeek ?? profile.defaultDaysPerWeek ?? null,
    defaultSessionMinutes:
      threadFacts.defaultSessionMinutes ??
      profile.defaultSessionMinutes ??
      null,
    equipmentSlugs: mergedEquipment,
    limitations: threadFacts.limitations ?? profile.limitations ?? null,
    limitationsConfirmedNone,
    weightUnit: threadFacts.weightUnit ?? profile.weightUnit ?? "lb",
    skipRemainingSlots:
      threadFacts.skipRemainingSlots === true || skipFromMessage,
  };
}

export function getMissingSlots(merged: MergedPlanningFacts): PlanningSlot[] {
  if (merged.skipRemainingSlots) {
    return [];
  }

  const missing: PlanningSlot[] = [];

  if (!merged.primaryGoal) missing.push("goal");
  if (!merged.experienceLevel) missing.push("experience");
  if (merged.defaultDaysPerWeek == null) missing.push("days");
  if (merged.defaultSessionMinutes == null) missing.push("minutes");
  if (merged.equipmentSlugs.length === 0) missing.push("equipment");
  const hasLimitations =
    merged.limitations !== null || merged.limitationsConfirmedNone;
  if (!hasLimitations) {
    missing.push("limitations");
  }

  return missing;
}

export function shouldAllowPropose(context: PlanningContext): boolean {
  return context.allowPropose;
}

export function buildPlanningContext(params: {
  purpose: ChatThread["purpose"];
  relatedPlanId?: string | null;
  relatedSessionId?: string | null;
  activePlanSummary?: PlanSummaryForContext | null;
  trainingSummary?: TrainingSummaryForPrompt | null;
  sessionContext?: SessionContextForPrompt | null;
  threadSummary?: string | null;
  profile: PlanningContext["profile"];
  equipmentSlugs: string[];
  equipmentCatalog: Equipment[];
  threadFacts: ThreadPlanningFacts | null;
  latestUserMessage: string | null;
}): PlanningContext {
  const threadFacts = params.threadFacts ?? {};
  const skipFromMessage = detectSkipRemainingSlots(params.latestUserMessage);
  const merged = mergePlanningFacts({
    profile: params.profile,
    equipmentSlugs: params.equipmentSlugs,
    threadFacts: {
      ...threadFacts,
      ...(skipFromMessage ? { skipRemainingSlots: true } : {}),
    },
    skipFromMessage,
  });

  const missingSlots = getMissingSlots(merged);

  return {
    purpose: params.purpose,
    relatedPlanId: params.relatedPlanId ?? null,
    relatedSessionId: params.relatedSessionId ?? null,
    activePlanSummary: params.activePlanSummary ?? null,
    trainingSummary: params.trainingSummary ?? null,
    sessionContext: params.sessionContext ?? null,
    threadSummary: params.threadSummary ?? null,
    profile: params.profile,
    equipmentSlugs: params.equipmentSlugs,
    equipmentCatalog: params.equipmentCatalog,
    threadFacts: {
      ...threadFacts,
      ...(skipFromMessage ? { skipRemainingSlots: true } : {}),
    },
    latestUserMessage: params.latestUserMessage,
    merged,
    missingSlots,
    allowPropose: missingSlots.length === 0,
  };
}

export function getEffectivePlanningFacts(
  context: PlanningContext
): MergedPlanningFacts {
  if (!context.merged.skipRemainingSlots) {
    return context.merged;
  }

  return {
    ...PLANNING_SAFE_DEFAULTS,
    ...context.merged,
    skipRemainingSlots: true,
    equipmentSlugs:
      context.merged.equipmentSlugs.length > 0
        ? context.merged.equipmentSlugs
        : PLANNING_SAFE_DEFAULTS.equipmentSlugs,
  };
}

export function planningContextForPrompt(context: PlanningContext) {
  const effective = getEffectivePlanningFacts(context);

  return {
    purpose: context.purpose,
    relatedPlanId: context.relatedPlanId,
    relatedSessionId: context.relatedSessionId,
    activePlanSummary: context.activePlanSummary,
    trainingSummary: trainingSummaryForPrompt(context.trainingSummary),
    sessionContext: context.sessionContext,
    threadSummary: context.threadSummary,
    profile: {
      primaryGoal: context.merged.primaryGoal,
      experienceLevel: context.merged.experienceLevel,
      defaultDaysPerWeek: context.merged.defaultDaysPerWeek,
      defaultSessionMinutes: context.merged.defaultSessionMinutes,
      limitations: context.merged.limitations,
      weightUnit: context.merged.weightUnit,
      customEquipmentNotes: context.profile.customEquipmentNotes,
    },
    equipmentSlugs: context.merged.equipmentSlugs,
    threadFacts: context.threadFacts,
    missingSlots: context.missingSlots,
    skipRemainingSlots: context.merged.skipRemainingSlots,
    allowPropose: context.allowPropose,
    effectiveDefaults: context.merged.skipRemainingSlots
      ? {
          primaryGoal: effective.primaryGoal,
          experienceLevel: effective.experienceLevel,
          defaultDaysPerWeek: effective.defaultDaysPerWeek,
          defaultSessionMinutes: effective.defaultSessionMinutes,
          equipmentSlugs: effective.equipmentSlugs,
          limitations: effective.limitations,
          weightUnit: effective.weightUnit,
        }
      : null,
  };
}
