import { getConfig } from "./config.ts";
import type { State } from "#types";
import fs from "node:fs";
import type { YMSPRuntime } from "./runtime.ts";
import path from "pathe";
import { getSpaces } from "./space.ts";
import { getTaskSignal } from "./task-context.ts";

export function writeState(runtime: YMSPRuntime, state: State) {
  const stateFilePath = runtime.stateFilePath;
  getTaskSignal(runtime);
  if (!stateFilePath) {
    runtime.state = structuredClone(state);
    return;
  }
  fs.mkdirSync(path.dirname(stateFilePath), { recursive: true });
  fs.writeFileSync(`${stateFilePath}.tmp`, JSON.stringify(state));
  fs.renameSync(`${stateFilePath}.tmp`, stateFilePath);
}

export async function readState(runtime: YMSPRuntime): Promise<State> {
  const stateFilePath = runtime.stateFilePath;
  if (!stateFilePath || fs.existsSync(stateFilePath)) {
    const data = stateFilePath
      ? (JSON.parse(fs.readFileSync(stateFilePath).toString()) as State)
      : structuredClone(runtime.state);
    const spaces = await getSpaces(runtime);

    // Set the default numMasterWindows of each unknown space to 1
    for (const space of spaces) {
      if (!Object.hasOwn(data, space.id.toString())) {
        Object.defineProperty(data, space.id.toString(), {
          value: { numMasterWindows: 1 },
          enumerable: true,
          writable: true,
          configurable: true,
        });
      }
    }

    // Delete unknown spaces
    for (const spaceId of getConfig(runtime).windowManager === "aerospace"
      ? []
      : Object.keys(data)) {
      if (!spaces.some((space) => space.id.toString() === spaceId)) {
        delete data[spaceId];
      }
    }

    return data;
  } else {
    const defaultState = Object.create(null) as State;
    const spaces = await getSpaces(runtime);

    for (const space of spaces) {
      defaultState[space.id] = { numMasterWindows: 1 };
    }

    writeState(runtime, defaultState);
    return defaultState;
  }
}
