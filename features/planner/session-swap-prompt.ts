export function buildSessionSwapInitialPrompt(params: {
  exerciseName: string;
  reason?: string;
}): string {
  const reasonSuffix = params.reason?.trim()
    ? ` Reason: ${params.reason.trim()}.`
    : "";

  return `I need a substitute for ${params.exerciseName} in my live workout.${reasonSuffix} Suggest alternatives I can do with my available equipment.`;
}
