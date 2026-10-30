import { create } from 'zustand';
import { User, AuthTokens } from '@/types';
import { authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.login({ email, password });
      localStorage.setItem('tn_access_token', data.accessToken);
      localStorage.setItem('tn_refresh_token', data.refreshToken);
      set({ user: data.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (formData) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.register(formData);
      localStorage.setItem('tn_access_token', data.accessToken);
      localStorage.setItem('tn_refresh_token', data.refreshToken);
      set({ user: data.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('tn_refresh_token');
    if (refreshToken) await authApi.logout(refreshToken).catch(() => {});
    localStorage.removeItem('tn_access_token');
    localStorage.removeItem('tn_refresh_token');
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user, isAuthenticated: true }),
}));

// Search store
export interface SearchStore {
  params: {
    city: string;
    checkin: string;
    checkout: string;
    adults: number;
    children: number;
  };
  setParams: (params: Partial<SearchStore['params']>) => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  params: {
    city: '',
    checkin: '',
    checkout: '',
    adults: 2,
    children: 0,
  },
  setParams: (p) => set((s) => ({ params: { ...s.params, ...p } })),
}));
