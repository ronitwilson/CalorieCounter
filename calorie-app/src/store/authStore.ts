import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { getUserByEmail, getUser } from './db';

// ─── Demo password logic ──────────────────────────────────────────────────────
// All users share the password 'password123'.
// The admin account also accepts 'admin123'.

function checkPassword(user: User, password: string): boolean {
  if (user.role === 'admin') {
    return password === 'admin123' || password === 'password123';
  }
  return password === 'password123';
}

// ─── State Interface ──────────────────────────────────────────────────────────

interface AuthState {
  /** The authenticated user (null if not logged in) */
  currentUser: User | null;
  /**
   * The userId currently being logged for.
   * Equals currentUser.userId for normal logging,
   * or a linked member's userId for proxy logging.
   */
  activeUserId: string | null;

  /**
   * Attempt to log in with the given credentials.
   * Returns { success: true } on success or { success: false, error } on failure.
   */
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;

  /** Clear auth state. */
  logout: () => void;

  /**
   * Switch the active user for proxy logging.
   * Can be the current user's own userId or a linked member's userId.
   */
  setActiveUser: (userId: string) => void;

  /**
   * Re-read the current user from the db store.
   * Call this after updating profile data so the UI reflects changes.
   */
  refreshCurrentUser: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      activeUserId: null,

      login: async (email: string, password: string) => {
        const user = getUserByEmail(email.trim());

        if (!user) {
          return { success: false, error: 'No account found with that email.' };
        }

        if (user.status === 'inactive') {
          return {
            success: false,
            error: 'Your account has been deactivated. Please contact admin.',
          };
        }

        if (!checkPassword(user, password)) {
          return { success: false, error: 'Incorrect password.' };
        }

        set({ currentUser: user, activeUserId: user.userId });
        return { success: true };
      },

      logout: () => {
        set({ currentUser: null, activeUserId: null });
      },

      setActiveUser: (userId: string) => {
        set({ activeUserId: userId });
      },

      refreshCurrentUser: () => {
        const { currentUser } = get();
        if (!currentUser) return;
        const fresh = getUser(currentUser.userId);
        if (fresh) {
          set({ currentUser: fresh });
        }
      },
    }),
    {
      name: 'ct_auth',
      // Only persist the minimal auth state; actions are recreated on load
      partialize: (state) => ({
        currentUser: state.currentUser,
        activeUserId: state.activeUserId,
      }),
    },
  ),
);
