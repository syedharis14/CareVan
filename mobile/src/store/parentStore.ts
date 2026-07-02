import { ChildSummary } from '@carevan/shared';
import { create } from 'zustand';
import { parentApi } from '../api/endpoints';

interface ParentState {
  loading: boolean;
  children: ChildSummary[];
  error: string | null;
  /** Pulls fresh child status. Called on open and on a poll interval — push is never guaranteed. */
  refresh: () => Promise<void>;
  childById: (studentId: string) => ChildSummary | undefined;
}

export const useParentStore = create<ParentState>()((set, get) => ({
  loading: false,
  children: [],
  error: null,

  refresh: async () => {
    set({ loading: true });
    try {
      const children = await parentApi.children();
      set({ children, error: null });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Could not load your children' });
    } finally {
      set({ loading: false });
    }
  },

  childById: (studentId) => get().children.find((c) => c.student.id === studentId),
}));
