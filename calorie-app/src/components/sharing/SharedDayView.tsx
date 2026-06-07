import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Download, ChevronDown } from 'lucide-react';
import {
  getSharedDayByToken,
  getMealEntries,
  saveMealEntry,
  generateId,
} from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { MEAL_SLOT_LABELS, MEAL_SLOTS } from '../../types';
import type { SharedDay, MealEntry } from '../../types';
import { today } from '../../utils/calories';

export default function SharedDayView() {
  const { token } = useParams<{ token: string }>();
  const currentUser = useAuthStore((s) => s.currentUser);
  const activeUserId = useAuthStore((s) => s.activeUserId);

  const [sharedDay, setSharedDay] = useState<SharedDay | null | undefined>(undefined);
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [importDate, setImportDate] = useState(today());
  const [imported, setImported] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!token) {
      setSharedDay(null);
      return;
    }
    getSharedDayByToken(token).then(async (sd) => {
      if (!sd) {
        setSharedDay(null);
        return;
      }
      setSharedDay(sd);
      const dayEntries = await getMealEntries(sd.sharedByUserId, sd.date);
      setEntries(dayEntries);
    });
  }, [token]);

  async function handleImport() {
    if (!sharedDay || !currentUser) return;
    const targetUserId = activeUserId ?? currentUser.userId;
    setImporting(true);
    try {
      await Promise.all(
        entries.map((entry) => {
          const newEntry: MealEntry = {
            ...entry,
            entryId: generateId(),
            userId: targetUserId,
            date: importDate,
            loggedBy: currentUser.userId,
            createdAt: new Date().toISOString(),
          };
          return saveMealEntry(newEntry);
        })
      );
      setImported(true);
      setShowImportForm(false);
    } finally {
      setImporting(false);
    }
  }

  // Loading state
  if (sharedDay === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not found
  if (sharedDay === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
        <div className="text-5xl">🔗</div>
        <h1 className="text-xl font-bold text-gray-900">Link not found</h1>
        <p className="text-sm text-gray-500 max-w-sm">
          This shared day link is invalid, has expired, or has been revoked.
        </p>
      </div>
    );
  }

  // Expired
  if (new Date(sharedDay.expiresAt) < new Date() || sharedDay.status === 'revoked') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
        <div className="text-5xl">⏰</div>
        <h1 className="text-xl font-bold text-gray-900">Link expired</h1>
        <p className="text-sm text-gray-500">This shared day link has expired.</p>
      </div>
    );
  }

  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 rounded-full px-4 py-1.5 text-sm font-medium mb-3">
          <Calendar size={14} />
          Shared Day Log
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {sharedDay.sharedByName}'s Log
        </h1>
        <p className="text-gray-500 mt-1">{sharedDay.date}</p>
        <p className="text-sm text-gray-400 mt-0.5">
          Total: <span className="font-semibold text-gray-700">{totalCalories.toLocaleString()} kcal</span>
        </p>
      </div>

      {/* Meal slots */}
      {MEAL_SLOTS.map((slot) => {
        const slotEntries = entries.filter((e) => e.mealSlot === slot);
        const slotCalories = slotEntries.reduce((sum, e) => sum + e.calories, 0);

        return (
          <div
            key={slot}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">
                {MEAL_SLOT_LABELS[slot]}
              </h3>
              {slotCalories > 0 && (
                <span className="text-xs text-gray-400">{slotCalories} kcal</span>
              )}
            </div>
            {slotEntries.length === 0 ? (
              <div className="px-5 py-3">
                <p className="text-sm text-gray-400 italic">No entries</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {slotEntries.map((entry) => (
                  <li
                    key={entry.entryId}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{entry.foodName}</p>
                      <p className="text-xs text-gray-400">{entry.grams}g</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {entry.calories} kcal
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {/* Import section (only for logged-in users) */}
      {currentUser && entries.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
          {imported ? (
            <div className="text-center">
              <p className="text-green-700 font-semibold">
                Entries imported successfully to {importDate}!
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-indigo-900">
                    Import to your log
                  </p>
                  <p className="text-xs text-indigo-600 mt-0.5">
                    Copy all {entries.length} entries to a date in your log.
                  </p>
                </div>
                <button
                  onClick={() => setShowImportForm((v) => !v)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-indigo-700 bg-white border border-indigo-300 hover:border-indigo-500 rounded-xl px-3 py-2 transition"
                >
                  <Download size={14} />
                  Import
                  <ChevronDown
                    size={13}
                    className={`transition-transform ${showImportForm ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>

              {showImportForm && (
                <div className="mt-4 flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-indigo-800 mb-1">
                      Import to date
                    </label>
                    <input
                      type="date"
                      value={importDate}
                      onChange={(e) => setImportDate(e.target.value)}
                      className="w-full border border-indigo-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-xl transition"
                  >
                    {importing ? 'Importing…' : 'Confirm'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
