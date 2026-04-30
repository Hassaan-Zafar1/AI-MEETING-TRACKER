import { create } from 'zustand';
import { User } from '../types';

// Zustand store is like a global variable that React components can subscribe to
// When it changes, all components using it re-render automatically

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initialize user from localStorage (persists on page refresh)
  user: localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user')!)
    : null,

  isAuthenticated: !!localStorage.getItem('user'),

  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({ user, isAuthenticated: !!user });
  },

  logout: () => {
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },
}));