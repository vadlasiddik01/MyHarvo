import { create } from 'zustand';

interface AuthState {
  userId: string | null;
  username: string | null;
  usernameHi: string | null;
  usernameTe: string | null;
  isLoggedIn: boolean;
  setUser: (userId: string, username: string, usernameHi?: string | null, usernameTe?: string | null) => void;
  setUsername: (username: string, usernameHi?: string | null, usernameTe?: string | null) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  userId: null,
  username: null,
  usernameHi: null,
  usernameTe: null,
  isLoggedIn: false,
  
  setUser: (userId: string, username: string, usernameHi = null, usernameTe = null) => {
    set({ userId, username, usernameHi, usernameTe, isLoggedIn: true });
    localStorage.setItem('harvesting-auth', JSON.stringify({ userId, username, usernameHi, usernameTe }));
  },

  setUsername: (username: string, usernameHi = null, usernameTe = null) => {
    set({ username, usernameHi, usernameTe });
    const stored = localStorage.getItem('harvesting-auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      localStorage.setItem('harvesting-auth', JSON.stringify({ ...parsed, username, usernameHi, usernameTe }));
    }
  },
  
  logout: () => {
    set({ userId: null, username: null, usernameHi: null, usernameTe: null, isLoggedIn: false });
    localStorage.removeItem('harvesting-auth');
  },
  
  checkAuth: async () => {
    const stored = localStorage.getItem('harvesting-auth');
    if (stored) {
      try {
        const { userId, username, usernameHi = null, usernameTe = null } = JSON.parse(stored);
        set({ userId, username, usernameHi, usernameTe, isLoggedIn: true });
      } catch {
        set({ userId: null, username: null, usernameHi: null, usernameTe: null, isLoggedIn: false });
      }
    }
  },
}));
