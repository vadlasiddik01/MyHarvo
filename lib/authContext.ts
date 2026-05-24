import { create } from 'zustand';

interface AuthState {
  userId: string | null;
  username: string | null;
  isLoggedIn: boolean;
  setUser: (userId: string, username: string) => void;
  setUsername: (username: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  userId: null,
  username: null,
  isLoggedIn: false,
  
  setUser: (userId: string, username: string) => {
    set({ userId, username, isLoggedIn: true });
    localStorage.setItem('harvesting-auth', JSON.stringify({ userId, username }));
  },

  setUsername: (username: string) => {
    set({ username });
    const stored = localStorage.getItem('harvesting-auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      localStorage.setItem('harvesting-auth', JSON.stringify({ ...parsed, username }));
    }
  },
  
  logout: () => {
    set({ userId: null, username: null, isLoggedIn: false });
    localStorage.removeItem('harvesting-auth');
  },
  
  checkAuth: async () => {
    const stored = localStorage.getItem('harvesting-auth');
    if (stored) {
      try {
        const { userId, username } = JSON.parse(stored);
        set({ userId, username, isLoggedIn: true });
      } catch {
        set({ userId: null, username: null, isLoggedIn: false });
      }
    }
  },
}));
