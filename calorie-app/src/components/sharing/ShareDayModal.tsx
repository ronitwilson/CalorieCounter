import { useState, useEffect } from 'react';
import { X, Link2, Users, Copy, Check, Search } from 'lucide-react';
import type { User } from '../../types';
import {
  saveSharedDay,
  saveNotification,
  getUsers,
  generateId,
} from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';

interface Props {
  date: string;
  onClose: () => void;
}

type Tab = 'link' | 'user';

export default function ShareDayModal({ date, onClose }: Props) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const refreshNotifications = useAppStore((s) => s.refreshNotifications);

  const [tab, setTab] = useState<Tab>('link');
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  // User tab state
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (currentUser) {
      getUsers().then((all) =>
        setUsers(all.filter((u) => u.userId !== currentUser.userId && u.status === 'active'))
      );
    }
  }, [currentUser]);

  async function generateLink() {
    if (!currentUser) return;
    setGeneratingLink(true);
    try {
      const newToken = generateId();
      setToken(newToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await saveSharedDay({
        shareId: generateId(),
        token: newToken,
        sharedByUserId: currentUser.userId,
        sharedByName: currentUser.name,
        date,
        method: 'link',
        status: 'active',
        expiresAt,
        createdAt: new Date().toISOString(),
      });
      setLinkGenerated(true);
    } finally {
      setGeneratingLink(false);
    }
  }

  function handleCopy() {
    const url = `${window.location.origin}${window.location.pathname}#/shared/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  async function handleShareWithUser(recipient: User) {
    if (!currentUser) return;
    const shareId = generateId();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await saveSharedDay({
      shareId,
      token: generateId(),
      sharedByUserId: currentUser.userId,
      sharedByName: currentUser.name,
      date,
      method: 'inapp',
      recipientUserId: recipient.userId,
      status: 'active',
      expiresAt,
      createdAt: new Date().toISOString(),
    });

    await saveNotification({
      notifId: generateId(),
      userId: recipient.userId,
      type: 'share_received',
      fromUserId: currentUser.userId,
      fromUserName: currentUser.name,
      shareId,
      read: false,
      createdAt: new Date().toISOString(),
    });

    refreshNotifications();
    setSentTo((prev) => new Set(prev).add(recipient.userId));
  }

  const filteredUsers = users.filter(
    (u) =>
      !search.trim() ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const shareUrl = token
    ? `${window.location.origin}${window.location.pathname}#/shared/${token}`
    : '';

  const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Share Day Log</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab('link')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition ${
              tab === 'link'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Link2 size={15} />
            Copy Link
          </button>
          <button
            onClick={() => setTab('user')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition ${
              tab === 'user'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users size={15} />
            Share with User
          </button>
        </div>

        <div className="px-6 py-5">
          {tab === 'link' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Generate a shareable link for your log on{' '}
                <span className="font-semibold">{date}</span>. The link expires in 7 days.
              </p>

              {!linkGenerated ? (
                <button
                  onClick={generateLink}
                  disabled={generatingLink}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                >
                  <Link2 size={15} />
                  {generatingLink ? 'Generating…' : 'Generate Link'}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-2">
                    <p className="text-xs text-gray-600 break-all flex-1 font-mono">
                      {shareUrl}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Expires: {expiryDate}</span>
                    <button
                      onClick={handleCopy}
                      className={`flex items-center gap-1.5 font-medium transition ${
                        copied
                          ? 'text-green-600'
                          : 'text-indigo-600 hover:text-indigo-800'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check size={13} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'user' && (
            <div className="space-y-4">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users by name or email…"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              {filteredUsers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No users found.</p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredUsers.map((u) => {
                    const sent = sentTo.has(u.userId);
                    return (
                      <li
                        key={u.userId}
                        className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {u.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => !sent && handleShareWithUser(u)}
                          disabled={sent}
                          className={`flex-shrink-0 ml-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                            sent
                              ? 'bg-green-100 text-green-700 cursor-default'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {sent ? 'Sent!' : 'Share'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
