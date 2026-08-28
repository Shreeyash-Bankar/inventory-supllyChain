import { minimal, common, ardupilotmega } from "node-mavlink";

export const REGISTRY = {
  ...minimal.REGISTRY,
  ...common.REGISTRY,
  ...ardupilotmega.REGISTRY,
};
