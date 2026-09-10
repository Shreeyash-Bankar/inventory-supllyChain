export interface MavlinkMessage<T = unknown> {
  name: string;
  messageId: number;
  systemId: number;
  componentId: number;
  data: T;
}
