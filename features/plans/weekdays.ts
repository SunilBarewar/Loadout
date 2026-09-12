/** JavaScript `Date.getDay()` convention: 0 = Sunday through 6 = Saturday. */
export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const WEEKDAY_LABELS_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_FIELD_DESCRIPTION =
  "Day of week (JavaScript convention): 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday. Monday is 1, not 0.";

/** Default weekday spread when activating a plan without explicit assignments. */
export const DEFAULT_WEEKDAY_PATTERNS: Record<number, Weekday[]> = {
  1: [1],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
  7: [0, 1, 2, 3, 4, 5, 6],
};

export function assignDefaultWeekdays(daysPerWeek: number): Weekday[] {
  const pattern = DEFAULT_WEEKDAY_PATTERNS[daysPerWeek];
  if (!pattern) {
    throw new Error(`Unsupported daysPerWeek: ${daysPerWeek}`);
  }

  return pattern;
}
