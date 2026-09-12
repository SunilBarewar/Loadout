import "server-only";

import { getSessionWithExercises, getSetLogsForSession } from "./repository";
import { buildSessionPageData } from "./formatters";
import type { SessionPageData } from "./schemas";

export async function getSessionPageData(
  sessionId: string,
  userId: string
): Promise<SessionPageData | null> {
  const loaded = await getSessionWithExercises(sessionId, userId);
  if (!loaded) {
    return null;
  }

  const setLogs = await getSetLogsForSession(sessionId, userId);

  return buildSessionPageData({
    session: loaded.session,
    exercises: loaded.exercises,
    setLogs,
  });
}
