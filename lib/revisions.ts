// The three spaced-repetition checkpoints, in days after first solve.
export const REVISION_INTERVALS_DAYS = [1, 7, 14] as const;

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function buildRevisionSchedule(firstSolvedAt: Date) {
  return REVISION_INTERVALS_DAYS.map((intervalDay) => ({
    dueDate: addDays(firstSolvedAt, intervalDay),
    intervalDay,
  }));
}
