import { useState, useEffect, useRef } from 'react';
import { X, Search, Zap } from 'lucide-react';
import type { FoodItem, MealEntry, MealSlot, ServingSize } from '../../types';
import { MEAL_SLOT_LABELS, MEAL_SLOTS } from '../../types';
import { getFoodItems, getServingSizes, saveMealEntry, generateId } from '../../store/db';
import { calcCalories } from '../../utils/calories';
import { useAuthStore } from '../../store/authStore';

interface Props {
  userId: string;
  date: string;
  initialSlot?: MealSlot;
  editEntry?: MealEntry;
  onClose: () => void;
  onSaved: () => void;
}

export default function LogMealModal({
  userId,
  date,
  initialSlot,
  editEntry,
  onClose,
  onSaved,
}: Props) {
  const currentUser = useAuthStore((s) => s.currentUser);

  const [selectedSlot, setSelectedSlot] = useState<MealSlot>(
    editEntry?.mealSlot ?? initialSlot ?? 'breakfast',
  );
  const [search, setSearch] = useState(editEntry?.foodName ?? '');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [grams, setGrams] = useState<number>(editEntry?.grams ?? 100);
  const [servingSizes, setServingSizes] = useState<ServingSize[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load food item when editing
  useEffect(() => {
    if (editEntry) {
      const foods = getFoodItems();
      const food = foods.find((f) => f.foodId === editEntry.foodId);
      if (food) setSelectedFood(food);
    }
  }, [editEntry]);

  // Load serving sizes when slot changes
  useEffect(() => {
    setServingSizes(getServingSizes(selectedSlot));
  }, [selectedSlot]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim() || selectedFood) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const query = search.toLowerCase().trim();
      const results = getFoodItems()
        .filter(
          (f) =>
            f.status === 'active' &&
            (f.name.toLowerCase().includes(query) ||
              f.category.toLowerCase().includes(query)),
        )
        .slice(0, 10);
      setSearchResults(results);
      setShowDropdown(results.length > 0);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, selectedFood]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const previewCalories = selectedFood
    ? calcCalories(selectedFood.caloriesPer100g, grams)
    : 0;

  function handleSelectFood(food: FoodItem) {
    setSelectedFood(food);
    setSearch(food.name);
    setShowDropdown(false);
  }

  function handleClearFood() {
    setSelectedFood(null);
    setSearch('');
  }

  function handleSave() {
    if (!selectedFood || !currentUser) return;

    const entry: MealEntry = {
      entryId: editEntry?.entryId ?? generateId(),
      userId,
      date,
      mealSlot: selectedSlot,
      foodId: selectedFood.foodId,
      foodName: selectedFood.name,
      caloriesPer100g: selectedFood.caloriesPer100g,
      grams,
      calories: previewCalories,
      loggedBy: currentUser.userId,
      createdAt: editEntry?.createdAt ?? new Date().toISOString(),
    };

    saveMealEntry(entry);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {editEntry ? 'Edit Entry' : 'Log Meal'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Meal slot selector */}
          {!initialSlot && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meal Slot
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MEAL_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium border transition ${
                      selectedSlot === slot
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    {MEAL_SLOT_LABELS[slot]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Food search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Food Item
            </label>
            <div className="relative" ref={searchRef}>
              <div className="relative flex items-center">
                <Search
                  size={16}
                  className="absolute left-3 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (selectedFood) setSelectedFood(null);
                  }}
                  placeholder="Search food items…"
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                {selectedFood && (
                  <button
                    onClick={handleClearFood}
                    className="absolute right-3 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                  {searchResults.map((food) => (
                    <button
                      key={food.foodId}
                      onClick={() => handleSelectFood(food)}
                      className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition border-b border-gray-50 last:border-0"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{food.name}</p>
                          <p className="text-xs text-gray-400">{food.category}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {food.caloriesPer100g} kcal/100g
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedFood && (
              <div className="mt-2 flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2">
                <span className="text-xs font-semibold text-indigo-700 truncate flex-1">
                  {selectedFood.name}
                </span>
                <span className="text-xs text-indigo-500 flex-shrink-0">
                  {selectedFood.caloriesPer100g} kcal/100g
                </span>
              </div>
            )}
          </div>

          {/* Serving sizes quick-select */}
          {servingSizes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Select (grams)
              </label>
              <div className="flex flex-wrap gap-2">
                {servingSizes.map((ss) => (
                  <button
                    key={ss.sizeId}
                    onClick={() => setGrams(ss.grams)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                      grams === ss.grams
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300'
                    }`}
                  >
                    {ss.grams}g
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom grams input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grams
            </label>
            <input
              type="number"
              min={1}
              max={9999}
              value={grams}
              onChange={(e) => setGrams(Math.max(1, Number(e.target.value)))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Live calorie preview */}
          {selectedFood && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <Zap size={16} className="text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800">
                <span className="font-bold text-lg">{previewCalories}</span> kcal
                <span className="text-green-600 ml-1">
                  for {grams}g of {selectedFood.name}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedFood}
            className="flex-1 py-2.5 bg-indigo-600 disabled:bg-indigo-300 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
          >
            {editEntry ? 'Save changes' : 'Add to log'}
          </button>
        </div>
      </div>
    </div>
  );
}
