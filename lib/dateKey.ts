/**
 * Returns a YYYY-MM-DD key in the LOCAL timezone (not UTC), so a solve
 * logged at 11pm IST doesn't get bucketed onto the wrong day the way
 * `date.toISOString().slice(0, 10)` would.
 */
export function dateKey(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSameDay(a: Date | string, b: Date | string): boolean {
  return dateKey(a) === dateKey(b);
}
