//-------------------------architecture changed 7/5/26---------------//
import { create } from "zustand";
export const useTelemetryStore = create((set) => ({
  messages: {},
  flash: {},
  attitude: { roll: 0, pitch: 0, yaw: 0 },
  attitudeHistory: [],
  _lastHistoryUpdate: 0,
  connectionState: "DISCONNECTED",
  statusLogs: [],

  // setConnectionState: (state) => set({ connectionState: state }),

  setConnectionState: (state) =>
    set((store) => ({
      connectionState: state,
      statusLogs:
        state === "CONNECTING" || state === "DISCONNECTED"
          ? []
          : store.statusLogs,
    })),

  setMessage: (msg) =>
    set((state) => {
      const now = Date.now();

      let updatedLogs = state.statusLogs;
      // let udpatedLogs = [...state.statusLogs];
      if (msg.type === "StatusText") {
        updatedLogs = [
          ...state.statusLogs,
          {
            id: crypto.randomUUID
              ? crypto.randomUUID()
              : Math.random().toString(36),
            text: msg.data.text || msg.data, // Fallback depending on your IPC data shape
            severity: msg.data.severity || "info",
            timestamp: now,
          },
        ].slice(-150); //  rolling history window of the last 150 log entries
      }

      return {
        messages: {
          ...state.messages,
          [msg.type]: {
            data: msg.data,
            updatedAt: now,
          },
        },
        flash: {
          ...state.flash,
          [msg.type]: now,
        },
        statusLogs: updatedLogs,
      };
    }),

  //  throttle history updates
  setAttitude: (roll, pitch, yaw) =>
    set((state) => {
      const now = Date.now();

      let newHistory = state.attitudeHistory;

      if (now - state._lastHistoryUpdate > 100) {
        newHistory = [
          ...state.attitudeHistory,
          { time: now, roll, pitch, yaw },
        ].slice(-100);
      }

      return {
        attitude: { roll, pitch, yaw },
        attitudeHistory: newHistory,
        _lastHistoryUpdate: now,
      };
    }),
}));
