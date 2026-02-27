import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  token: string | null;
  role: string | null;
  language: 'en' | 'hi';
  login: (token: string, role: string) => void;
  logout: () => void;
  setLanguage: (lang: 'en' | 'hi') => void;
}

const useStore = create<AppState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      language: 'en',
      login: (newToken: string, newRole: string) => set({ token: newToken, role: newRole }),
      logout: () => set({ token: null, role: null }),
      setLanguage: (lang: 'en' | 'hi') => set({ language: lang }),
    }),
    {
      name: 'safeguard-storage',
    }
  )
);

export default useStore;
