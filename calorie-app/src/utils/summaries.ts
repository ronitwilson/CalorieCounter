import {
  type MealEntry,
  type DailySummary,
  type WeeklySummary,
  type MonthlySummary,
  type DayTotals,
  type MealSlotSummary,
  MEAL_SLOTS,
} from '../types';
import { getMealEntries, getMealEntriesRange, getUser } from '../lib/api';
import { getWeekRange, getMonthDays, addDays } from './calories';

// ─── Daily Summary ────────────────────────────────────────────────────────────

export async function buildDailySummary(
  userId: string,
  date: string,
): Promise<DailySummary> {
  const [entries, user] = await Promise.all([
    getMealEntries(userId, date),
    getUser(userId),
  ]);

  const calorieGoal = user?.calorieGoal ?? 2000;

  const byMealSlot: MealSlotSummary[] = MEAL_SLOTS.map((slot) => {
    const slotEntries = entries.filter((e: MealEntry) => e.mealSlot === slot);
    return {
      mealSlot: slot,
      totalCalories: slotEntries.reduce((sum: number, e: MealEntry) => sum + e.calories, 0),
      entries: slotEntries,
    };
  });

  const totalCalories = byMealSlot.reduce((sum, s) => sum + s.totalCalories, 0);
  const remaining = calorieGoal - totalCalories;
  const percentOfGoal =
    calorieGoal > 0 ? Math.round((totalCalories / calorieGoal) * 1000) / 10 : 0;

  return { userId, date, calorieGoal, totalCalories, remaining, percentOfGoal, byMealSlot };
}

// ─── Weekly Summary ───────────────────────────────────────────────────────────

export async function buildWeeklySummary(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<WeeklySummary> {
  const [allEntries, user] = await Promise.all([
    getMealEntriesRange(userId, startDate, endDate),
    getUser(userId),
  ]);

  const calorieGoal = user?.calorieGoal ?? 2000;
  const days = buildDateRange(startDate, endDate).map((date) =>
    buildDayTotals(date, allEntries, calorieGoal),
  );

  const daysWithData = days.filter((d) => d.totalCalories > 0);
  const totalCalories = daysWithData.reduce((sum, d) => sum + d.totalCalories, 0);
  const averageCalories =
    daysWithData.length > 0 ? Math.round(totalCalories / daysWithData.length) : 0;
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

export async function buildWeeklySummaryForDate(
  userId: string,
  dateStr: string,
): Promise<WeeklySummary> {
  const { start, end } = getWeekRange(dateStr);
  return buildWeeklySummary(userId, start, end);
}

// ─── Monthly Summary ──────────────────────────────────────────────────────────

export async function buildMonthlySummary(
  userId: string,
  year: number,
  month: number,
): Promise<MonthlySummary> {
  const dates = getMonthDays(year, month);
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const [allEntries, user] = await Promise.all([
    getMealEntriesRange(userId, startDate, endDate),
    getUser(userId),
  ]);

  const calorieGoal = user?.calorieGoal ?? 2000;
  const days = dates.map((date) => buildDayTotals(date, allEntries, calorieGoal));

  const daysWithData = days.filter((d) => d.totalCalories > 0);
  const totalCalories = daysWithData.reduce((sum, d) => sum + d.totalCalories, 0);
  const averageCalories =
    daysWithData.length > 0 ? Math.round(totalCalories / daysWithData.length) : 0;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDayTotals(
  date: string,
  allEntries: MealEntry[],
  calorieGoal: number,
): DayTotals {
  const dayEntries = allEntries.filter((e) => e.date === date);
  const totalCalories = dayEntries.reduce((sum, e) => sum + e.calories, 0);
  return { date, totalCalories, calorieGoal, withinGoal: totalCalories <= calorieGoal };
}

function buildDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let current = startDate;
  while (current <= endDate) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}
