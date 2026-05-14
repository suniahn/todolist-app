import { create } from 'zustand';
import type { User } from '../types/domain';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  currentUser: User | null;
  setTokens: (at: string, rt: string) => void;
  setCurrentUser: (user: User) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  currentUser: null,
  setTokens: (at, rt) => set({ accessToken: at, refreshToken: rt }),
  setCurrentUser: (user) => set({ currentUser: user }),
  clearAuth: () => set({ accessToken: null, refreshToken: null, currentUser: null }),
  isAuthenticated: () => get().accessToken !== null,
}));
