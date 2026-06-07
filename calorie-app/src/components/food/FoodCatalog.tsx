import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Eye, EyeOff } from 'lucide-react';
import type { FoodItem, FoodCategory } from '../../types';
import { getFoodItems, saveFoodItem } from '../../lib/api';
import FoodItemModal from './FoodItemModal';

const CATEGORIES: (FoodCategory | 'All')[] = [
  'All', 'Grains', 'Protein', 'Dairy', 'Vegetables', 'Fruits', 'Snacks', 'Beverages',
];

const categoryBadge: Record<string, string> = {
  Grains: 'bg-yellow-100 text-yellow-800',
  Protein: 'bg-red-100 text-red-800',
  Dairy: 'bg-blue-100 text-blue-800',
  Vegetables: 'bg-green-100 text-green-800',
  Fruits: 'bg-orange-100 text-orange-800',
  Snacks: 'bg-purple-100 text-purple-800',
  Beverages: 'bg-cyan-100 text-cyan-800',
};

export default function FoodCatalog() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FoodCategory | 'All'>('All');
  const [showDeleted, setShowDeleted] = useState(false);
  const [editItem, setEditItem] = useState<FoodItem | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getFoodItems()
      .then(setItems)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  async function handleSoftDelete(item: FoodItem) {
    await saveFoodItem({ ...item, status: 'deleted' });
    setRefreshKey((k) => k + 1);
    setDeleteConfirm(null);
  }

  async function handleRestore(item: FoodItem) {
    await saveFoodItem({ ...item, status: 'active' });
    setRefreshKey((k) => k + 1);
  }

  const filtered = items.filter((item) => {
    if (!showDeleted && item.status === 'deleted') return false;
    const matchesSearch =
      !search.trim() ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Food Catalog</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.filter((i) => i.status === 'active').length} active items
          </p>
        </div>
        <button
          onClick={() => { setEditItem(undefined); setShowModal(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
        >
          <Plus size={16} />
          Add Food Item
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or category…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat as FoodCategory | 'All')}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                categoryFilter === cat
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={() => setShowDeleted((v) => !v)}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition ${
              showDeleted
                ? 'bg-gray-700 border-gray-700 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            {showDeleted ? <EyeOff size={12} /> : <Eye size={12} />}
            {showDeleted ? 'Hide deleted' : 'Show deleted'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">No food items found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kcal/100g</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item) => (
                  <tr
                    key={item.foodId}
                    className={`hover:bg-gray-50 transition ${item.status === 'deleted' ? 'opacity-50' : ''}`}
                  >
                    <td className="px-5 py-3.5">
                      <span className={`font-medium text-gray-900 ${item.status === 'deleted' ? 'line-through text-gray-400' : ''}`}>
                        {item.name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${categoryBadge[item.category] ?? 'bg-gray-100 text-gray-600'}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-gray-700">{item.caloriesPer100g}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === 'active' ? (
                          <>
                            <button
                              onClick={() => { setEditItem(item); setShowModal(true); }}
                              className="p-1.5 rounded-lg hover:bg-indigo-100 text-gray-400 hover:text-indigo-600 transition"
                              aria-label="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            {deleteConfirm === item.foodId ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleSoftDelete(item)}
                                  className="text-xs bg-red-500 text-white px-2 py-0.5 rounded font-medium hover:bg-red-600 transition"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(item.foodId)}
                                className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition"
                                aria-label="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => handleRestore(item)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-200 hover:border-indigo-400 rounded-lg px-2.5 py-1 transition"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <FoodItemModal
          item={editItem}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); setRefreshKey((k) => k + 1); }}
        />
      )}
    </div>
  );
}
