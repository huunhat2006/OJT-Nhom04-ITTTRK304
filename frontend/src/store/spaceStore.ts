// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FinancialSpace } from '../types';

interface SpaceState {
  spaces: FinancialSpace[];
  currentSpace: FinancialSpace | null;
  setSpaces: (spaces: FinancialSpace[]) => void;
  setCurrentSpace: (space: FinancialSpace) => void;
  addSpace: (space: FinancialSpace) => void;
  updateSpace: (space: FinancialSpace) => void;
  removeSpace: (id: number) => void;
  reset: () => void;
}

export const useSpaceStore = create<SpaceState>()(
  persist(
    (set) => ({
      spaces: [],
      currentSpace: null,
      setSpaces: (spaces) => set({ spaces }),
      setCurrentSpace: (space) => set({ currentSpace: space }),
      addSpace: (space) =>
        set((state) => ({ spaces: [...state.spaces, space] })),
      updateSpace: (space) =>
        set((state) => ({
          spaces: state.spaces.map((s) => (s.id === space.id ? space : s)),
          currentSpace:
            state.currentSpace?.id === space.id ? space : state.currentSpace,
        })),
      removeSpace: (id) =>
        set((state) => ({
          spaces: state.spaces.filter((s) => s.id !== id),
          currentSpace:
            state.currentSpace?.id === id ? null : state.currentSpace,
        })),
      reset: () => set({ spaces: [], currentSpace: null }),
    }),
    {
      name: 'space-storage',
    }
  )
);
