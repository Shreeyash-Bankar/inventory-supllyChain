import { create } from "zustand";

export const useHardWareStore = create((set) => ({
  hardwareStatus: {},
  connectionState: "Disconnected",

  setConnectionState: (state) => set({ connectionState: state }),

  setHardwareStatus: (msg) => set({ hardwareStatus: msg }),
}));
