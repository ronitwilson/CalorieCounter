import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  BarChart2,
  Users,
  Utensils,
  Menu,
  X,
  Settings,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getUser } from '../../store/db';
import Header from './Header';

const navLinkBase =
  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors';
const navLinkActive = 'bg-indigo-100 text-indigo-700';
const navLinkInactive = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const activeUserId = useAuthStore((s) => s.activeUserId);
  const setActiveUser = useAuthStore((s) => s.setActiveUser);

  const isAdmin = currentUser?.role === 'admin';
  const isProxy = currentUser && activeUserId !== currentUser.userId;
  const proxiedUser = isProxy && activeUserId ? getUser(activeUserId) : null;

  function linkCls({ isActive }: { isActive: boolean }) {
    return `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white rounded-xl p-1.5">
            <Utensils size={18} />
          </div>
          <span className="text-xl font-bold text-gray-900">CalorieTrack</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 lg:hidden"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Proxy logging banner */}
      {isProxy && proxiedUser && (
        <div className="mx-3 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-amber-800">
            Logging for: {proxiedUser.name}
          </p>
          <button
            onClick={() => {
              if (currentUser) setActiveUser(currentUser.userId);
            }}
            className="text-xs text-amber-700 underline hover:text-amber-900 mt-0.5"
          >
            Switch back to self
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavLink to="/" end className={linkCls} onClick={onClose}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        {isAdmin && (
          <NavLink to="/food" className={linkCls} onClick={onClose}>
            <BookOpen size={18} />
            Food Catalog
          </NavLink>
        )}

        <NavLink to="/reports" className={linkCls} onClick={onClose}>
          <BarChart2 size={18} />
          Reports
        </NavLink>

        <NavLink to="/members" className={linkCls} onClick={onClose}>
          <UserCheck size={18} />
          Members
        </NavLink>

        {isAdmin && (
          <>
            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Admin
              </p>
            </div>
            <NavLink to="/admin/users" className={linkCls} onClick={onClose}>
              <Users size={18} />
              User Management
            </NavLink>
            <NavLink to="/admin/meal-config" className={linkCls} onClick={onClose}>
              <Settings size={18} />
              Meal Config
            </NavLink>
          </>
        )}
      </nav>

      {/* Current user info at bottom */}
      {currentUser && (
        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-900 truncate">{currentUser.name}</p>
          <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
          <span className="inline-block mt-1 text-[10px] font-semibold bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 uppercase">
            {currentUser.role}
          </span>
        </div>
      )}
    </div>
  );
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-72 h-full bg-white shadow-2xl flex flex-col">
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile hamburger in header area */}
        <div className="lg:hidden flex items-center h-16 px-4 bg-white border-b border-gray-200 gap-3 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex-1">
            <Header />
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden lg:block">
          <Header />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
