export const Commands = {
  rtl: () => send("RTL"),
  missionStart: () => send("MISSION_START"),
  engineStart: () => send("ENGINE_START"),
  stop: () => send("STOP"),
  setMode: (mode) => send("SET_MODE", { mode }),
};

function send(cmd, payload = {}) {
  return window.electron.flightCommand(cmd, payload);
}
