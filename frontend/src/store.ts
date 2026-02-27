import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  token: string | null;
  role: string | null;
  login: (token: string, role: string) => void;
  logout: () => void;
}

const useStore = create<AppState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      login: (newToken: string, newRole: string) => set({ token: newToken, role: newRole }),
      logout: () => set({ token: null, role: null }),
    }),
    {
      name: 'safeguard-storage',
    }
  )
);

export default useStore;
