import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Share2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { buildDailySummary } from '../../utils/summaries';
import { addDays, today } from '../../utils/calories';
import { MEAL_SLOT_LABELS, MEAL_SLOTS } from '../../types';
import type { DailySummary, MealSlot } from '../../types';
import DailyProgressBar from '../reports/DailyProgressBar';
import MealEntryRow from './MealEntryRow';
import LogMealModal from './LogMealModal';
import ShareDayModal from '../sharing/ShareDayModal';
import { format, parseISO } from 'date-fns';

export default function DayView() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const activeUserId = useAuthStore((s) => s.activeUserId);
  const selectedDate = useAppStore((s) => s.selectedDate);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);

  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [addSlot, setAddSlot] = useState<MealSlot | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const userId = activeUserId ?? currentUser?.userId ?? '';

  useEffect(() => {
    if (!userId) return;
    setSummary(null);
    buildDailySummary(userId, selectedDate).then(setSummary);
  }, [userId, selectedDate, refreshKey]);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  function handlePrevDay() {
    setSelectedDate(addDays(selectedDate, -1));
  }

  function handleNextDay() {
    setSelectedDate(addDays(selectedDate, 1));
  }

  function handleToday() {
    setSelectedDate(today());
  }

  const isToday = selectedDate === today();

  const formattedDate = (() => {
    try {
      return format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy');
    } catch {
      return selectedDate;
    }
  })();

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const remaining = summary.calorieGoal - summary.totalCalories;
  const isOver = remaining < 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevDay}
          className="p-2 rounded-xl hover:bg-gray-200 text-gray-600 transition"
          aria-label="Previous day"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="text-center flex-1 mx-2">
          <p className="text-lg font-bold text-gray-900">{formattedDate}</p>
          {isToday && (
            <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5">
              Today
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isToday && (
            <button
              onClick={handleToday}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 rounded-lg px-2.5 py-1.5 transition"
            >
              Today
            </button>
          )}
          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl hover:bg-gray-200 text-gray-600 transition"
            aria-label="Next day"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Daily progress card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Daily Progress</h2>
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 rounded-lg px-2.5 py-1.5 transition"
          >
            <Share2 size={13} />
            Share Day
          </button>
        </div>

        <DailyProgressBar consumed={summary.totalCalories} goal={summary.calorieGoal} />

        <div className="flex items-center justify-between pt-1">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {summary.totalCalories.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">consumed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-400">
              {summary.calorieGoal.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">goal</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${isOver ? 'text-red-600' : 'text-green-600'}`}>
              {isOver ? '+' : ''}{Math.abs(remaining).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">{isOver ? 'over goal' : 'remaining'}</p>
          </div>
        </div>
      </div>

      {/* Meal slots */}
      {MEAL_SLOTS.map((slot) => {
        const slotSummary = summary.byMealSlot.find((s) => s.mealSlot === slot);
        const entries = slotSummary?.entries ?? [];
        const slotCalories = slotSummary?.totalCalories ?? 0;

        return (
          <div
            key={slot}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {MEAL_SLOT_LABELS[slot]}
                </h3>
                {slotCalories > 0 && (
                  <p className="text-xs text-gray-400">{slotCalories} kcal</p>
                )}
              </div>
              <button
                onClick={() => setAddSlot(slot)}
                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 hover:border-indigo-600 rounded-lg px-3 py-1.5 transition"
              >
                <Plus size={13} />
                Add food
              </button>
            </div>

            {entries.length === 0 ? (
              <div className="px-5 py-3">
                <p className="text-sm text-gray-400 italic">No entries yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {entries.map((entry) => (
                  <MealEntryRow key={entry.entryId} entry={entry} onChanged={refresh} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {addSlot && (
        <LogMealModal
          userId={userId}
          date={selectedDate}
          initialSlot={addSlot}
          onClose={() => setAddSlot(null)}
          onSaved={() => {
            setAddSlot(null);
            refresh();
          }}
        />
      )}

      {showShare && (
        <ShareDayModal date={selectedDate} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}
