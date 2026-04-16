import { create } from 'zustand';
import { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

// Mock users for demo
const MOCK_USERS: Record<string, User & { password: string }> = {
  'driver@facturemap.com': {
    id: 'd1',
    email: 'driver@facturemap.com',
    password: 'driver123',
    name: 'Ahmed Benali',
    role: 'driver',
    phone: '+213 555 123 456',
    vehicleId: 'v1',
    createdAt: '2026-01-15',
  },
  'admin@facturemap.com': {
    id: 'a1',
    email: 'admin@facturemap.com',
    password: 'admin123',
    name: 'Karim Mansouri',
    role: 'admin',
    phone: '+213 555 789 012',
    createdAt: '2025-11-01',
  },
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const mockUser = MOCK_USERS[email.toLowerCase()];
    if (mockUser && mockUser.password === password) {
      const { password: _, ...user } = mockUser;
      set({ user, isAuthenticated: true, isLoading: false });
    } else {
      set({ isLoading: false });
      throw new Error('Email ou mot de passe incorrect');
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user: User) => {
    set({ user, isAuthenticated: true });
  },
}));
