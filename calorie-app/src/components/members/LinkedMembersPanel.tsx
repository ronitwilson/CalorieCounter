import { useState, useEffect } from 'react';
import { Plus, UserCheck, UserX, UserCog } from 'lucide-react';
import type { LinkedMember, User } from '../../types';
import {
  getLinkedMembers,
  saveLinkedMember,
  deleteLinkedMemberById,
  getUsers,
  generateId,
  saveNotification,
} from '../../store/db';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';

export default function LinkedMembersPanel() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const activeUserId = useAuthStore((s) => s.activeUserId);
  const setActiveUser = useAuthStore((s) => s.setActiveUser);
  const refreshNotifications = useAppStore((s) => s.refreshNotifications);

  const [members, setMembers] = useState<LinkedMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [addError, setAddError] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (!currentUser) return;
    setMembers(getLinkedMembers(currentUser.userId));
    if (isAdmin) {
      setAllUsers(
        getUsers().filter(
          (u) =>
            u.userId !== currentUser.userId &&
            u.status === 'active',
        ),
      );
    }
  }, [currentUser, isAdmin, refreshKey]);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  function handleLogFor(memberId: string) {
    setActiveUser(memberId);
  }

  function handleLogForSelf() {
    if (currentUser) setActiveUser(currentUser.userId);
  }

  function handleRemove(linkId: string) {
    deleteLinkedMemberById(linkId);
    // If currently logging for this member, switch back to self
    const member = members.find((m) => m.linkId === linkId);
    if (member && activeUserId === member.memberId && currentUser) {
      setActiveUser(currentUser.userId);
    }
    refresh();
  }

  function handleAddMember() {
    setAddError('');
    if (!selectedUserId || !currentUser) return;

    // Check not already linked
    if (members.some((m) => m.memberId === selectedUserId)) {
      setAddError('This user is already linked.');
      return;
    }

    const memberUser = allUsers.find((u) => u.userId === selectedUserId);
    if (!memberUser) return;

    const link: LinkedMember = {
      linkId: generateId(),
      ownerId: currentUser.userId,
      memberId: memberUser.userId,
      memberName: memberUser.name,
      linkedAt: new Date().toISOString(),
      linkedBy: currentUser.userId,
    };
    saveLinkedMember(link);

    // Notify the linked member
    saveNotification({
      notifId: generateId(),
      userId: memberUser.userId,
      type: 'member_linked',
      fromUserId: currentUser.userId,
      fromUserName: currentUser.name,
      read: false,
      createdAt: new Date().toISOString(),
    });
    refreshNotifications();

    setSelectedUserId('');
    setShowAddForm(false);
    refresh();
  }

  const unlinkedUsers = allUsers.filter(
    (u) => !members.some((m) => m.memberId === u.userId),
  );

  if (!currentUser) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Linked Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Log meals on behalf of linked members.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setShowAddForm((v) => !v);
              setAddError('');
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
          >
            <Plus size={16} />
            Add Link
          </button>
        )}
      </div>

      {/* Add member form (admin only) */}
      {isAdmin && showAddForm && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mb-5 space-y-3">
          <h2 className="text-sm font-semibold text-indigo-900">Link a member</h2>
          <div className="flex gap-3">
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setAddError('');
              }}
              className="flex-1 border border-indigo-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Select a user…</option>
              {unlinkedUsers.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            <button
              onClick={handleAddMember}
              disabled={!selectedUserId}
              className="px-4 py-2 bg-indigo-600 disabled:bg-indigo-300 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition"
            >
              Link
            </button>
          </div>
          {addError && (
            <p className="text-xs text-red-600">{addError}</p>
          )}
          {unlinkedUsers.length === 0 && (
            <p className="text-xs text-indigo-600">All active users are already linked.</p>
          )}
        </div>
      )}

      {/* Currently logging as banner */}
      {activeUserId !== currentUser.userId && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Currently logging for:{' '}
              {members.find((m) => m.memberId === activeUserId)?.memberName ?? 'Unknown'}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              All meal entries will be logged under this member.
            </p>
          </div>
          <button
            onClick={handleLogForSelf}
            className="flex-shrink-0 text-xs text-amber-800 border border-amber-300 hover:border-amber-500 bg-white rounded-lg px-3 py-1.5 font-medium transition"
          >
            Switch to self
          </button>
        </div>
      )}

      {/* Members list */}
      {members.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <UserCog size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No linked members</p>
          <p className="text-sm text-gray-400 mt-1">
            {isAdmin
              ? 'Use "Add Link" to link users to your account.'
              : 'An admin can link members to your account.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const isLoggingFor = activeUserId === member.memberId;
            return (
              <div
                key={member.linkId}
                className={`bg-white rounded-2xl border shadow-sm p-5 flex items-center justify-between transition ${
                  isLoggingFor
                    ? 'border-indigo-300 ring-1 ring-indigo-200'
                    : 'border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {member.memberName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {member.memberName}
                    </p>
                    {isLoggingFor && (
                      <span className="text-xs font-medium text-indigo-600">
                        Currently logging as this member
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  {isLoggingFor ? (
                    <button
                      onClick={handleLogForSelf}
                      className="flex items-center gap-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 hover:border-indigo-400 rounded-lg px-3 py-1.5 transition"
                    >
                      <UserCheck size={13} />
                      Switch back
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLogFor(member.memberId)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-1.5 transition"
                    >
                      <UserCheck size={13} />
                      Log for {member.memberName.split(' ')[0]}
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleRemove(member.linkId)}
                      className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition"
                      aria-label="Remove link"
                    >
                      <UserX size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
