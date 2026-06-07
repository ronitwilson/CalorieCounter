import { useEffect, useState } from 'react';
import { X, Share2, Users, Eye } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import {
  getNotifications,
  markNotificationReadById,
  markAllNotificationsReadForUser,
} from '../../lib/api';
import type { Notification, NotificationType } from '../../types';

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NotifIcon({ type }: { type: NotificationType }) {
  if (type === 'share_received') return <Share2 size={16} className="text-indigo-500" />;
  if (type === 'share_viewed') return <Eye size={16} className="text-blue-500" />;
  return <Users size={16} className="text-green-500" />;
}

function notifMessage(n: Notification): string {
  if (n.type === 'share_received') return `${n.fromUserName} shared a day log with you.`;
  if (n.type === 'share_viewed') return `${n.fromUserName} viewed your shared day.`;
  if (n.type === 'member_linked') return `${n.fromUserName} linked you as a member.`;
  return 'New notification.';
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ open, onClose }: Props) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const refreshNotifications = useAppStore((s) => s.refreshNotifications);
  const notificationsVersion = useAppStore((s) => s.notificationsVersion);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    getNotifications(currentUser.userId).then(setNotifications);
  }, [currentUser, notificationsVersion, open]);

  async function handleMarkRead(notifId: string) {
    await markNotificationReadById(notifId);
    refreshNotifications();
  }

  async function handleMarkAllRead() {
    if (!currentUser) return;
    await markAllNotificationsReadForUser(currentUser.userId);
    refreshNotifications();
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <span className="text-4xl">🔔</span>
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map((n) => (
                <li
                  key={n.notifId}
                  className={`px-5 py-4 flex gap-3 cursor-pointer hover:bg-gray-50 transition ${
                    !n.read ? 'bg-indigo-50' : ''
                  }`}
                  onClick={() => {
                    if (!n.read) handleMarkRead(n.notifId);
                  }}
                >
                  <div className="flex-shrink-0 mt-0.5 bg-white rounded-full p-1.5 shadow-sm border border-gray-100">
                    <NotifIcon type={n.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                      {notifMessage(n)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <div className="flex-shrink-0 mt-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 block" />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
