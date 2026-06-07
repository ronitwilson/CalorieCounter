import {
  type MealEntry,
  type DailySummary,
  type WeeklySummary,
  type MonthlySummary,
  type DayTotals,
  type MealSlotSummary,
  MEAL_SLOTS,
} from '../types';
import { getMealEntries, getUser } from '../store/db';
import { getWeekRange, getMonthDays, addDays } from './calories';

// ─── Daily Summary ────────────────────────────────────────────────────────────

/**
 * Build a DailySummary for a given user and date (YYYY-MM-DD).
 * Reads meal entries from localStorage.
 */
export function buildDailySummary(userId: string, date: string): DailySummary {
  const user = getUser(userId);
  const calorieGoal = user?.calorieGoal ?? 2000;

  const entries: MealEntry[] = getMealEntries(userId, date);

  // Aggregate by meal slot
  const byMealSlot: MealSlotSummary[] = MEAL_SLOTS.map((slot) => {
    const slotEntries = entries.filter((e) => e.mealSlot === slot);
    const totalCalories = slotEntries.reduce((sum, e) => sum + e.calories, 0);
    return {
      mealSlot: slot,
      totalCalories,
      entries: slotEntries,
    };
  });

  const totalCalories = byMealSlot.reduce(
    (sum, s) => sum + s.totalCalories,
    0,
  );
  const remaining = calorieGoal - totalCalories;
  const percentOfGoal =
    calorieGoal > 0
      ? Math.round((totalCalories / calorieGoal) * 1000) / 10 // 1 decimal place
      : 0;

  return {
    userId,
    date,
    calorieGoal,
    totalCalories,
    remaining,
    percentOfGoal,
    byMealSlot,
  };
}

// ─── Helper: build DayTotals for a single date ────────────────────────────────

function buildDayTotals(
  userId: string,
  date: string,
  calorieGoal: number,
): DayTotals {
  const entries = getMealEntries(userId, date);
  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);
  return {
    date,
    totalCalories,
    calorieGoal,
    withinGoal: totalCalories <= calorieGoal,
  };
}

// ─── Helper: generate all dates in [startDate, endDate] inclusive ─────────────

function dateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let current = startDate;
  // Walk forward until we exceed endDate
  while (current <= endDate) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

// ─── Weekly Summary ───────────────────────────────────────────────────────────

/**
 * Build a WeeklySummary for a given user between two dates.
 * Typically startDate is Monday and endDate is Sunday of the same week,
 * but any range works.
 */
export function buildWeeklySummary(
  userId: string,
  startDate: string,
  endDate: string,
): WeeklySummary {
  const user = getUser(userId);
  const calorieGoal = user?.calorieGoal ?? 2000;

  const dates = dateRange(startDate, endDate);

  const days: DayTotals[] = dates.map((date) =>
    buildDayTotals(userId, date, calorieGoal),
  );

  const totalCalories = days.reduce((sum, d) => sum + d.totalCalories, 0);
  const daysWithData = days.filter((d) => d.totalCalories > 0);
  const averageCalories =
    daysWithData.length > 0
      ? Math.round(totalCalories / daysWithData.length)
      : 0;
  const daysWithinGoal = days.filter((d) => d.withinGoal && d.totalCalories > 0).length;

  return {
    userId,
    startDate,
    endDate,
    days,
    averageCalories,
    totalCalories,
    calorieGoal,
    daysWithinGoal,
  };
}

/**
 * Build a WeeklySummary for the week (Mon–Sun) containing the given date.
 */
export function buildWeeklySummaryForDate(
  userId: string,
  dateStr: string,
): WeeklySummary {
  const { start, end } = getWeekRange(dateStr);
  return buildWeeklySummary(userId, start, end);
}

// ─── Monthly Summary ──────────────────────────────────────────────────────────

/**
 * Build a MonthlySummary for a given user, year, and month (1-based).
 */
export function buildMonthlySummary(
  userId: string,
  year: number,
  month: number,
): MonthlySummary {
  const user = getUser(userId);
  const calorieGoal = user?.calorieGoal ?? 2000;

  const dates = getMonthDays(year, month);

  const days: DayTotals[] = dates.map((date) =>
    buildDayTotals(userId, date, calorieGoal),
  );

  const daysWithData = days.filter((d) => d.totalCalories > 0);
  const totalCalories = daysWithData.reduce((sum, d) => sum + d.totalCalories, 0);
  const averageCalories =
    daysWithData.length > 0
      ? Math.round(totalCalories / daysWithData.length)
      : 0;
  const daysWithinGoal = daysWithData.filter((d) => d.withinGoal).length;

  return {
    userId,
    year,
    month,
    days,
    averageCalories,
    totalCalories,
    calorieGoal,
    daysWithinGoal,
    daysLogged: daysWithData.length,
  };
}
