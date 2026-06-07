import { useState, useEffect } from 'react';
import { Plus, Edit2, UserX, UserCheck } from 'lucide-react';
import type { User } from '../../types';
import { getUsers, adminSetUserStatus } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import UserModal from './UserModal';

export default function UserManagement() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<User | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    getUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  async function toggleStatus(user: User) {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    await adminSetUserStatus(user.userId, newStatus);
    refresh();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {users.filter((u) => u.status === 'active').length} active users
          </p>
        </div>
        <button
          onClick={() => { setEditUser(undefined); setShowModal(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
        >
          <Plus size={16} />
          Invite User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Goal (kcal)</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => {
                  const isSelf = user.userId === currentUser?.userId;
                  return (
                    <tr
                      key={user.userId}
                      className={`hover:bg-gray-50 transition ${user.status === 'inactive' ? 'opacity-60' : ''}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            {isSelf && <span className="text-xs text-indigo-500 font-medium">(you)</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-gray-700">
                        {user.calorieGoal.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditUser(user); setShowModal(true); }}
                            className="p-1.5 rounded-lg hover:bg-indigo-100 text-gray-400 hover:text-indigo-600 transition"
                            aria-label="Edit user"
                          >
                            <Edit2 size={14} />
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => toggleStatus(user)}
                              className={`p-1.5 rounded-lg transition ${user.status === 'active' ? 'hover:bg-red-100 text-gray-400 hover:text-red-600' : 'hover:bg-green-100 text-gray-400 hover:text-green-600'}`}
                              aria-label={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
                            >
                              {user.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <UserModal
          user={editUser}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); refresh(); }}
        />
      )}
    </div>
  );
}
