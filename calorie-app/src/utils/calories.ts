import {
  format,
  parse,
  addDays as dfAddDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  getDaysInMonth,
} from 'date-fns';

// ─── Calorie Calculation ──────────────────────────────────────────────────────

/**
 * Calculate the calories for a food item given its energy density and serving weight.
 * Result is rounded to the nearest whole calorie.
 */
export function calcCalories(caloriesPer100g: number, grams: number): number {
  return Math.round((caloriesPer100g / 100) * grams);
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

const DATE_FMT = 'yyyy-MM-dd';

/**
 * Format a Date object as a YYYY-MM-DD string.
 */
export function formatDate(date: Date): string {
  return format(date, DATE_FMT);
}

/**
 * Parse a YYYY-MM-DD string into a Date object.
 * The resulting Date is at midnight local time.
 */
export function parseDate(dateStr: string): Date {
  return parse(dateStr, DATE_FMT, new Date());
}

/**
 * Return today's date as a YYYY-MM-DD string.
 */
export function today(): string {
  return formatDate(new Date());
}

/**
 * Add (or subtract, if negative) the given number of days to a YYYY-MM-DD string
 * and return the resulting YYYY-MM-DD string.
 */
export function addDays(dateStr: string, days: number): string {
  return formatDate(dfAddDays(parseDate(dateStr), days));
}

/**
 * Return the Monday–Sunday week range that contains the given date.
 * Both start and end are returned as YYYY-MM-DD strings.
 */
export function getWeekRange(dateStr: string): { start: string; end: string } {
  const d = parseDate(dateStr);
  const start = startOfWeek(d, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(d, { weekStartsOn: 1 });     // Sunday
  return { start: formatDate(start), end: formatDate(end) };
}

/**
 * Return an array of all YYYY-MM-DD strings for the given calendar month.
 * `month` is 1-indexed (1 = January, 12 = December).
 */
export function getMonthDays(year: number, month: number): string[] {
  const daysInMonth = getDaysInMonth(new Date(year, month - 1, 1));
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month - 1, daysInMonth);

  return eachDayOfInterval({ start: firstDay, end: lastDay }).map((d) =>
    formatDate(d),
  );
}
