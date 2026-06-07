import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  signIn,
  signOut,
  fetchAuthSession,
  confirmSignIn,
} from 'aws-amplify/auth';
import type { User } from '../types';
import { getUser } from '../lib/api';

interface AuthState {
  currentUser: User | null;
  /**
   * userId currently being logged for.
   * Equals currentUser.userId for normal logging;
   * differs when proxy-logging for a linked member.
   */
  activeUserId: string | null;

  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string; requiresNewPassword?: boolean }>;

  /**
   * Complete forced password reset (first sign-in after admin invite).
   */
  completeNewPassword: (
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;

  logout: () => Promise<void>;

  setActiveUser: (userId: string) => void;

  /** Re-fetch currentUser profile from DynamoDB (e.g. after calorieGoal update). */
  refreshCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      activeUserId: null,

      login: async (email, password) => {
        try {
          const result = await signIn({
            username: email.trim(),
            password,
          });

          // Admin-invited user must set a new password on first sign-in
          if (
            result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'
          ) {
            return { success: false, requiresNewPassword: true };
          }

          if (!result.isSignedIn) {
            return { success: false, error: 'Sign-in not completed.' };
          }

          return await loadCurrentUser();
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Login failed. Please try again.';
          return { success: false, error: message };
        }
      },

      completeNewPassword: async (newPassword) => {
        try {
          const result = await confirmSignIn({
            challengeResponse: newPassword,
          });
          if (!result.isSignedIn) {
            return { success: false, error: 'Password reset not completed.' };
          }
          return await loadCurrentUser();
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Password reset failed.';
          return { success: false, error: message };
        }
      },

      logout: async () => {
        await signOut();
        set({ currentUser: null, activeUserId: null });
      },

      setActiveUser: (userId) => {
        set({ activeUserId: userId });
      },

      refreshCurrentUser: async () => {
        const { currentUser } = get();
        if (!currentUser) return;
        const fresh = await getUser(currentUser.userId);
        if (fresh) {
          set({ currentUser: { ...fresh, role: currentUser.role } });
        }
      },
    }),
    {
      name: 'ct_auth',
      partialize: (state) => ({
        currentUser: state.currentUser,
        activeUserId: state.activeUserId,
      }),
    },
  ),
);

// ─── Helper ───────────────────────────────────────────────────────────────────

async function loadCurrentUser(): Promise<{ success: boolean; error?: string }> {
  const session = await fetchAuthSession();
  const sub = session.tokens?.idToken?.payload?.sub as string | undefined;
  if (!sub) return { success: false, error: 'Could not retrieve user identity.' };

  // Determine role from Cognito group membership
  const groups =
    (session.tokens?.accessToken?.payload?.['cognito:groups'] as string[] | undefined) ?? [];
  const cognitoRole = groups.includes('admin') ? 'admin' : 'user';

  const profile = await getUser(sub);
  if (!profile) {
    await signOut();
    return {
      success: false,
      error: 'User profile not found. Please contact an administrator.',
    };
  }

  if (profile.status === 'inactive') {
    await signOut();
    return {
      success: false,
      error: 'Your account has been deactivated. Please contact an administrator.',
    };
  }

  useAuthStore.setState({
    currentUser: { ...profile, role: cognitoRole as 'admin' | 'user' },
    activeUserId: sub,
  });

  return { success: true };
}
