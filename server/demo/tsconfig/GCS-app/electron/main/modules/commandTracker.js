export class CommandTracker {
  constructor(win) {
    this.win = win;
    this.pending = new Map();
  }

  send(commandId, sendFn) {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(commandId);
        reject("TIMEOUT");
      }, 3000);

      this.pending.set(commandId, { resolve, reject, timeout });

      await sendFn();
    });
  }

  ack(command, status) {
    const entry = this.pending.get(command);
    if (!entry) return;

    clearTimeout(entry.timeout);
    this.pending.delete(command);

    if (status === "ACCEPTED") {
      entry.resolve(true);
    } else {
      entry.reject(status);
    }
  }
}
