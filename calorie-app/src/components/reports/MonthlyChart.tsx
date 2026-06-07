import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { buildMonthlySummary } from '../../utils/summaries';
import type { MonthlySummary, DayTotals } from '../../types';
import { format, parseISO, getDay } from 'date-fns';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function cellColor(day: DayTotals | undefined): string {
  if (!day || day.totalCalories === 0) return 'bg-gray-100 text-gray-400';
  if (day.withinGoal) return 'bg-green-100 text-green-800 font-semibold';
  return 'bg-red-100 text-red-800 font-semibold';
}

export default function MonthlyChart() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const activeUserId = useAuthStore((s) => s.activeUserId);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(false);

  const userId = activeUserId ?? currentUser?.userId ?? '';

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    buildMonthlySummary(userId, year, month)
      .then(setSummary)
      .finally(() => setLoading(false));
  }, [userId, year, month]);

  function prevMonth() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!summary) return null;

  // Build calendar grid: pad start with blanks to align Mon-Sun
  const dayMap: Record<string, DayTotals> = {};
  summary.days.forEach((d) => {
    dayMap[d.date] = d;
  });

  // Day of week for the first of the month (0=Sun, 1=Mon, … 6=Sat)
  const firstDate = new Date(year, month - 1, 1);
  const rawDow = getDay(firstDate); // 0=Sun
  const startOffset = rawDow === 0 ? 6 : rawDow - 1; // Mon=0 … Sun=6

  const totalCells = startOffset + summary.days.length;
  const gridCells = Math.ceil(totalCells / 7) * 7;

  const bestDay = summary.days.reduce<DayTotals | null>((best, d) => {
    if (d.totalCalories === 0) return best;
    if (!best || d.totalCalories < best.totalCalories) return d;
    return best;
  }, null);

  const worstDay = summary.days.reduce<DayTotals | null>((worst, d) => {
    if (d.totalCalories === 0) return worst;
    if (!worst || d.totalCalories > worst.totalCalories) return d;
    return worst;
  }, null);

  const daysOver = summary.daysLogged - summary.daysWithinGoal;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Monthly Report</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl hover:bg-gray-200 text-gray-600 transition"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-semibold text-gray-700 min-w-[150px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl hover:bg-gray-200 text-gray-600 transition"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        {/* Day labels */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-semibold text-gray-400 uppercase py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: gridCells }).map((_, i) => {
            const dayIndex = i - startOffset;
            if (dayIndex < 0 || dayIndex >= summary.days.length) {
              return <div key={i} className="aspect-square" />;
            }
            const dayData = summary.days[dayIndex];
            const dayNum = dayIndex + 1;
            const color = cellColor(dayData);
            const isToday =
              dayData.date === format(new Date(), 'yyyy-MM-dd');

            return (
              <button
                key={i}
                onClick={() => {
                  setSelectedDate(dayData.date);
                }}
                title={
                  dayData.totalCalories > 0
                    ? `${dayData.totalCalories.toLocaleString()} kcal`
                    : 'No data'
                }
                className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs transition hover:opacity-80 ${color} ${
                  isToday ? 'ring-2 ring-indigo-400 ring-offset-1' : ''
                }`}
              >
                <span className="text-[11px] font-bold leading-none">{dayNum}</span>
                {dayData.totalCalories > 0 && (
                  <span className="text-[9px] leading-none mt-0.5 opacity-75">
                    {dayData.totalCalories >= 1000
                      ? `${(dayData.totalCalories / 1000).toFixed(1)}k`
                      : dayData.totalCalories}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-4 justify-center text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-green-200 inline-block" />
            Within goal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-200 inline-block" />
            Over goal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gray-200 inline-block" />
            No data
          </span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {summary.averageCalories.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Avg daily intake</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{summary.daysWithinGoal}</p>
          <p className="text-xs text-gray-400 mt-0.5">Days within goal</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className={`text-2xl font-bold ${daysOver > 0 ? 'text-red-500' : 'text-gray-300'}`}>
            {daysOver}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Days over goal</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{summary.daysLogged}</p>
          <p className="text-xs text-gray-400 mt-0.5">Days logged</p>
        </div>
        {bestDay && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-base font-bold text-green-700">
              {format(parseISO(bestDay.date), 'MMM d')}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {bestDay.totalCalories.toLocaleString()} kcal
            </p>
            <p className="text-xs text-gray-400">Best day (lowest)</p>
          </div>
        )}
        {worstDay && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-base font-bold text-red-600">
              {format(parseISO(worstDay.date), 'MMM d')}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {worstDay.totalCalories.toLocaleString()} kcal
            </p>
            <p className="text-xs text-gray-400">Worst day (highest)</p>
          </div>
        )}
      </div>
    </div>
  );
}
