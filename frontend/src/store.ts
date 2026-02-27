import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  token: string | null;
  refreshToken: string | null;
  role: string | null;
  language: 'en' | 'hi';
  login: (token: string, role: string, refreshToken?: string) => void;
  setToken: (token: string) => void;
  logout: () => void;
  setLanguage: (lang: 'en' | 'hi') => void;
}

const useStore = create<AppState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      role: null,
      language: 'en',
      login: (newToken: string, newRole: string, newRefreshToken?: string) =>
        set({ token: newToken, role: newRole, refreshToken: newRefreshToken ?? null }),
      setToken: (newToken: string) => set({ token: newToken }),
      logout: () => set({ token: null, refreshToken: null, role: null }),
      setLanguage: (lang: 'en' | 'hi') => set({ language: lang }),
    }),
    {
      name: 'safeguard-storage',
    }
  )
);

export default useStore;
