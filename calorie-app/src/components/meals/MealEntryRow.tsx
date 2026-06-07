import { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import type { MealEntry, MealSlot } from '../../types';
import LogMealModal from './LogMealModal';
import { deleteMealEntryById } from '../../store/db';

interface Props {
  entry: MealEntry;
  onChanged: () => void;
}

export default function MealEntryRow({ entry, onChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function handleDelete() {
    deleteMealEntryById(entry.entryId);
    onChanged();
    setConfirming(false);
  }

  return (
    <>
      <div className="flex items-center gap-3 py-2.5 px-4 hover:bg-gray-50 rounded-xl transition group">
        {/* Food name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{entry.foodName}</p>
          <p className="text-xs text-gray-400">{entry.grams}g</p>
        </div>

        {/* Calories */}
        <div className="flex-shrink-0 text-sm font-semibold text-gray-700 w-16 text-right">
          {entry.calories} kcal
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg hover:bg-indigo-100 text-gray-400 hover:text-indigo-600 transition"
            aria-label="Edit entry"
          >
            <Edit2 size={14} />
          </button>
          {confirming ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                className="text-xs bg-red-500 text-white px-2 py-0.5 rounded font-medium hover:bg-red-600 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-xs text-gray-500 hover:text-gray-700 px-1"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition"
              aria-label="Delete entry"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {editing && (
        <LogMealModal
          userId={entry.userId}
          date={entry.date}
          initialSlot={entry.mealSlot as MealSlot}
          editEntry={entry}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            onChanged();
          }}
        />
      )}
    </>
  );
}
