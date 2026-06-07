import { create } from 'zustand';
import { today } from '../utils/calories';

// ─── State Interface ──────────────────────────────────────────────────────────

interface AppState {
  /**
   * The date the user is currently viewing/logging for.
   * Stored as YYYY-MM-DD string. Defaults to today's date.
   */
  selectedDate: string;

  /** Update the selected date. */
  setSelectedDate: (date: string) => void;

  /**
   * Monotonically incrementing counter.
   * Increment this to signal that notification data should be refreshed
   * (e.g. after saving a new notification).
   */
  notificationsVersion: number;

  /** Increment notificationsVersion to trigger a notification refresh. */
  refreshNotifications: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set) => ({
  selectedDate: today(),

  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },

  notificationsVersion: 0,

  refreshNotifications: () => {
    set((state) => ({ notificationsVersion: state.notificationsVersion + 1 }));
  },
}));
