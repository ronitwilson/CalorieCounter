import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { buildWeeklySummary } from '../../utils/summaries';
import { getWeekRange, addDays, today } from '../../utils/calories';
import type { WeeklySummary } from '../../types';
import { format, parseISO } from 'date-fns';

export default function WeeklyChart() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const activeUserId = useAuthStore((s) => s.activeUserId);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);

  const [referenceDate, setReferenceDate] = useState(today());
  const [summary, setSummary] = useState<WeeklySummary | null>(null);

  const navigate = useNavigate();
  const userId = activeUserId ?? currentUser?.userId ?? '';
  const { start, end } = getWeekRange(referenceDate);

  useEffect(() => {
    if (!userId) return;
    setSummary(buildWeeklySummary(userId, start, end));
  }, [userId, start, end]);

  function prevWeek() {
    setReferenceDate(addDays(start, -1));
  }

  function nextWeek() {
    setReferenceDate(addDays(end, 1));
  }

  function handleBarClick(dateStr: string) {
    setSelectedDate(dateStr);
    navigate('/');
  }

  if (!summary) return null;

  const chartData = summary.days.map((d) => ({
    date: d.date,
    label: format(parseISO(d.date), 'EEE'),
    fullLabel: format(parseISO(d.date), 'MMM d'),
    calories: d.totalCalories,
    goal: d.calorieGoal,
    withinGoal: d.withinGoal || d.totalCalories === 0,
    isToday: d.date === today(),
  }));

  const weekLabel = `${format(parseISO(start), 'MMM d')} – ${format(parseISO(end), 'MMM d, yyyy')}`;

  const daysOver = summary.days.filter(
    (d) => !d.withinGoal && d.totalCalories > 0,
  ).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Weekly Report</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={prevWeek}
            className="p-2 rounded-xl hover:bg-gray-200 text-gray-600 transition"
            aria-label="Previous week"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-semibold text-gray-700 min-w-[180px] text-center">
            {weekLabel}
          </span>
          <button
            onClick={nextWeek}
            className="p-2 rounded-xl hover:bg-gray-200 text-gray-600 transition"
            aria-label="Next week"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {summary.totalCalories.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Total calories</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {summary.averageCalories.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Avg per day</p>
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
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-5">
          Calories by day
          <span className="ml-2 text-xs font-normal text-gray-400">(click a bar to view that day)</span>
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            barCategoryGap="30%"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9ca3af' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              width={45}
            />
            <Tooltip
              cursor={{ fill: 'rgba(99,102,241,0.05)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
                    <p className="font-semibold text-gray-900">{d.fullLabel}</p>
                    <p className="text-gray-700 mt-1">
                      <span className="font-bold">{d.calories.toLocaleString()}</span> kcal
                    </p>
                    <p className="text-gray-400">Goal: {d.goal.toLocaleString()} kcal</p>
                  </div>
                );
              }}
            />
            <ReferenceLine
              y={summary.calorieGoal}
              stroke="#6366f1"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: `Goal: ${summary.calorieGoal}`,
                position: 'right',
                fontSize: 11,
                fill: '#6366f1',
              }}
            />
            <Bar
              dataKey="calories"
              radius={[6, 6, 0, 0]}
              cursor="pointer"
              onClick={(data) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                handleBarClick((data as any).date as string);
              }}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.calories === 0
                      ? '#e5e7eb'
                      : entry.withinGoal
                      ? '#22c55e'
                      : '#ef4444'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-3 justify-center text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
            Within goal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
            Over goal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-gray-200 inline-block" />
            No data
          </span>
        </div>
      </div>
    </div>
  );
}
