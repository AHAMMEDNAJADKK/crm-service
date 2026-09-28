import { create } from 'zustand';

export const useQueueStore = create((set) => ({
  bays: [],
  waiting: [],
  setQueueData: (bays, waiting) => set({ bays: bays || [], waiting: waiting || [] }),
  updateJobStatus: (tokenNumber, status) => set((state) => {
    // Helper to update status inside local arrays if a singular event fires
    const updatedBays = state.bays.map(b => {
      if (b.tokenNumber === tokenNumber) {
        return { ...b, status };
      }
      return b;
    });
    return { bays: updatedBays };
  })
}));

export default useQueueStore;
