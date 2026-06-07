import { useState, useEffect, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ServingSize, MealSlot } from '../../types';
import { MEAL_SLOT_LABELS, MEAL_SLOTS } from '../../types';
import { getServingSizes, saveServingSize, deleteServingSizeById, generateId } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function MealConfig() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [activeTab, setActiveTab] = useState<MealSlot>('breakfast');
  const [sizes, setSizes] = useState<ServingSize[]>([]);
  const [newGrams, setNewGrams] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    getServingSizes(activeTab)
      .then(setSizes)
      .finally(() => setLoading(false));
    setNewGrams('');
    setError('');
  }, [activeTab, refreshKey]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError('');
    const grams = Number(newGrams);
    if (!grams || grams <= 0 || grams > 9999) {
      setError('Please enter a valid gram amount (1–9999).');
      return;
    }
    if (sizes.some((s) => s.grams === grams)) {
      setError(`${grams}g already exists for this meal slot.`);
      return;
    }
    if (!currentUser) return;

    const ss: ServingSize = {
      sizeId: generateId(),
      mealSlot: activeTab,
      grams,
      createdBy: currentUser.userId,
      createdAt: new Date().toISOString(),
    };
    await saveServingSize(ss);
    setRefreshKey((k) => k + 1);
    setNewGrams('');
  }

  async function handleDelete(sizeId: string) {
    await deleteServingSizeById(sizeId);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meal Configuration</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure predefined serving sizes for each meal slot.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {MEAL_SLOTS.map((slot) => (
          <button
            key={slot}
            onClick={() => setActiveTab(slot)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
              activeTab === slot
                ? 'bg-indigo-600 border-indigo-600 text-white shadow'
                : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
            }`}
          >
            {MEAL_SLOT_LABELS[slot]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">
          {MEAL_SLOT_LABELS[activeTab]} — Serving Sizes
        </h2>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sizes.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No serving sizes configured for this slot.</p>
        ) : (
          <ul className="space-y-2">
            {sizes
              .sort((a, b) => a.grams - b.grams)
              .map((ss) => (
                <li key={ss.sizeId} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">g</span>
                    <span className="text-sm font-semibold text-gray-800">{ss.grams}g</span>
                  </div>
                  <button
                    onClick={() => handleDelete(ss.sizeId)}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition"
                    aria-label="Delete serving size"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
          </ul>
        )}

        <form onSubmit={handleAdd} className="flex gap-3 pt-2 border-t border-gray-100">
          <div className="flex-1">
            <input
              type="number"
              min={1}
              max={9999}
              placeholder="Enter grams (e.g. 150)"
              value={newGrams}
              onChange={(e) => { setNewGrams(e.target.value); setError(''); }}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
          >
            <Plus size={15} />
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
