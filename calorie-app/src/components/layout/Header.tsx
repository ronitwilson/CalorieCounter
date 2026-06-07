import { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, ChevronDown, Users } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { getLinkedMembers, getNotifications } from '../../lib/api';
import type { LinkedMember } from '../../types';
import NotificationPanel from './NotificationPanel';

export default function Header() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const activeUserId = useAuthStore((s) => s.activeUserId);
  const setActiveUser = useAuthStore((s) => s.setActiveUser);
  const logout = useAuthStore((s) => s.logout);
  const notificationsVersion = useAppStore((s) => s.notificationsVersion);

  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [linkedMembers, setLinkedMembers] = useState<LinkedMember[]>([]);

  const memberDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;
    getLinkedMembers(currentUser.userId).then(setLinkedMembers);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    getNotifications(currentUser.userId).then((notifs) => {
      setUnreadCount(notifs.filter((n) => !n.read).length);
    });
  }, [currentUser, notificationsVersion]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        memberDropdownRef.current &&
        !memberDropdownRef.current.contains(e.target as Node)
      ) {
        setShowMemberDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!currentUser) return null;

  const activeLinkedMember = linkedMembers.find((lm) => lm.memberId === activeUserId);
  const activeLabel =
    activeUserId === currentUser.userId
      ? currentUser.name
      : activeLinkedMember?.memberName ?? currentUser.name;

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 z-30 relative">
        {/* Left: Logo on mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <span className="text-lg font-bold text-indigo-700">CalorieTrack</span>
        </div>

        {/* Center spacer on desktop */}
        <div className="hidden lg:block" />

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Member switcher - show if has linked members */}
          {linkedMembers.length > 0 && (
            <div className="relative" ref={memberDropdownRef}>
              <button
                onClick={() => setShowMemberDropdown((v) => !v)}
                className="flex items-center gap-1.5 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg px-3 py-1.5 transition"
              >
                <Users size={15} />
                <span className="hidden sm:inline">Logging as:</span>
                <span className="font-semibold">{activeLabel}</span>
                <ChevronDown size={14} />
              </button>

              {showMemberDropdown && (
                <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[180px] py-1">
                  {/* Self */}
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition ${
                      activeUserId === currentUser.userId
                        ? 'font-semibold text-indigo-700'
                        : 'text-gray-700'
                    }`}
                    onClick={() => {
                      setActiveUser(currentUser.userId);
                      setShowMemberDropdown(false);
                    }}
                  >
                    {currentUser.name} (me)
                  </button>
                  {/* Linked members */}
                  {linkedMembers.map((lm) => (
                    <button
                      key={lm.linkId}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition ${
                        activeUserId === lm.memberId
                          ? 'font-semibold text-indigo-700'
                          : 'text-gray-700'
                      }`}
                      onClick={() => {
                        setActiveUser(lm.memberId);
                        setShowMemberDropdown(false);
                      }}
                    >
                      {lm.memberName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notification bell */}
          <button
            onClick={() => setShowNotifPanel((v) => !v)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition text-gray-600"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition px-2 py-1.5 rounded-lg hover:bg-red-50"
            aria-label="Logout"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Notification panel slide-in */}
      <NotificationPanel
        open={showNotifPanel}
        onClose={() => setShowNotifPanel(false)}
      />
    </>
  );
}
