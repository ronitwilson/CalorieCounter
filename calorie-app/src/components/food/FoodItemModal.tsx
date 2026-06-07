import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { FoodItem, FoodCategory } from '../../types';
import { saveFoodItem, generateId } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const CATEGORIES: FoodCategory[] = [
  'Grains', 'Protein', 'Dairy', 'Vegetables', 'Fruits', 'Snacks', 'Beverages',
];

interface Props {
  item?: FoodItem;
  onClose: () => void;
  onSaved: () => void;
}

export default function FoodItemModal({ item, onClose, onSaved }: Props) {
  const currentUser = useAuthStore((s) => s.currentUser);

  const [name, setName] = useState(item?.name ?? '');
  const [calories, setCalories] = useState<number>(item?.caloriesPer100g ?? 100);
  const [category, setCategory] = useState<FoodCategory>(item?.category ?? 'Grains');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Name is required.'); return; }
    if (calories <= 0) { setError('Calories must be a positive number.'); return; }
    if (!currentUser) return;

    setSaving(true);
    try {
      const food: FoodItem = {
        foodId: item?.foodId ?? generateId(),
        name: name.trim(),
        caloriesPer100g: calories,
        category,
        createdBy: item?.createdBy ?? currentUser.userId,
        status: item?.status ?? 'active',
        createdAt: item?.createdAt ?? new Date().toISOString(),
      };
      await saveFoodItem(food);
      onSaved();
    } catch {
      setError('Failed to save food item. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {item ? 'Edit Food Item' : 'Add Food Item'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chicken Breast (grilled)"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calories per 100g <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={0}
              max={9999}
              value={calories}
              onChange={(e) => setCalories(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FoodCategory)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition bg-white"
            >
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-indigo-600 disabled:bg-indigo-400 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
            >
              {saving ? 'Saving…' : item ? 'Save changes' : 'Add item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
