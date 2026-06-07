import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { User, UserRole } from '../../types';
import { adminCreateUser, adminUpdateUserRole, saveUser } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

interface Props {
  user?: User;
  onClose: () => void;
  onSaved: () => void;
}

export default function UserModal({ user, onClose, onSaved }: Props) {
  const currentUser = useAuthStore((s) => s.currentUser);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [role, setRole] = useState<UserRole>(user?.role ?? 'user');
  const [calorieGoal, setCalorieGoal] = useState<number>(user?.calorieGoal ?? 2000);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Name is required.'); return; }
    if (!user && (!email.trim() || !email.includes('@'))) {
      setError('A valid email is required.');
      return;
    }
    if (calorieGoal <= 0) { setError('Calorie goal must be positive.'); return; }

    setSaving(true);
    try {
      if (user) {
        // Update existing user
        await saveUser({ userId: user.userId, name: name.trim(), calorieGoal });
        // Handle role change separately (updates Cognito group)
        if (role !== user.role) {
          await adminUpdateUserRole(user.userId, role);
        }
      } else {
        // Invite new user via Lambda (creates Cognito user + DDB record)
        await adminCreateUser({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          role,
          calorieGoal,
          invitedBy: currentUser?.userId,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {user ? 'Edit User' : 'Invite User'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              <p className="text-xs text-gray-400 mt-1">
                An invitation email with a temporary password will be sent.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition bg-white"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Calorie Goal</label>
            <input
              type="number"
              min={100}
              max={9999}
              value={calorieGoal}
              onChange={(e) => setCalorieGoal(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
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
              {saving ? 'Saving…' : user ? 'Save changes' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
