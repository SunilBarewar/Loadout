import "server-only";

import type { SessionExercise } from "@/db/schema";
import { getSessionWithExercises } from "@/features/sessions/repository";
import { parseChatParts } from "../schemas/envelope";
import type { ExerciseCarouselPartData } from "../schemas/exercise-carousel";
import {
  findAppliedAlternativeId,
  type ExerciseCarouselSwapKey,
} from "./exercise-carousel-hydration";

export async function getExerciseCarouselSwapStates(
  messages: Array<{ parts: unknown }>,
  userId: string
): Promise<Map<ExerciseCarouselSwapKey, string>> {
  const carouselParts: ExerciseCarouselPartData[] = [];

  for (const message of messages) {
    for (const part of parseChatParts(message.parts)) {
      if (part.type === "exercise_carousel") {
        carouselParts.push(part.data);
      }
    }
  }

  if (carouselParts.length === 0) {
    return new Map();
  }

  const sessionIds = [...new Set(carouselParts.map((part) => part.sessionId))];
  const exercisesBySessionId = new Map<string, SessionExercise[]>();

  await Promise.all(
    sessionIds.map(async (sessionId) => {
      const loaded = await getSessionWithExercises(sessionId, userId);
      if (loaded) {
        exercisesBySessionId.set(sessionId, loaded.exercises);
      }
    })
  );

  const states = new Map<ExerciseCarouselSwapKey, string>();

  for (const part of carouselParts) {
    const exercises = exercisesBySessionId.get(part.sessionId);
    if (!exercises) {
      continue;
    }

    const appliedAlternativeId = findAppliedAlternativeId(part, exercises);
    if (appliedAlternativeId) {
      states.set(
        `${part.sessionId}:${part.sessionExerciseId}`,
        appliedAlternativeId
      );
    }
  }

  return states;
}
