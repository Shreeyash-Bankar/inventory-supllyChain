import {
  MavLinkPacketSplitter,
  MavLinkPacketParser,
  minimal,
  common,
  ardupilotmega,
} from "node-mavlink";

export function startTelemetry(port, mainWindow) {
  const REGISTRY = {
    ...minimal.REGISTRY,
    ...common.REGISTRY,
    ...ardupilotmega.REGISTRY,
  };

  const reader = port
    .pipe(new MavLinkPacketSplitter())
    .pipe(new MavLinkPacketParser(REGISTRY));

  reader.on("data", (packet) => {
    const id = packet.header.msgid;

    switch (id) {
      case 24:
        console.log("GPS:", packet);
        break;

      case 30:
        console.log("ATTITUDE:", packet);
        break;

      case 33:
        console.log("GLOBAL POSITION:", packet);
        break;

      default:
        console.log("UNKNOWN MSG:", id, packet.payload);
    }

    console.log({
      msgid: packet.header.msgid,
      payloadSize: packet.header.payloadLength,
      raw: packet.payload,
    });
  });
}
