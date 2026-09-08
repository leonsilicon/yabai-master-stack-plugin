import { getConfig } from "./config.ts";
import type { State } from "#types";
import fs from "node:fs";
import { configDirectory } from "./config-directory.ts";
import path from "pathe";
import { getSpaces } from "./space.ts";
import { getTaskSignal } from "./task-context.ts";

const yabaiStateFilePath = path.join(configDirectory, "state.json");

function getStateFilePath() {
  return getConfig().windowManager === "aerospace"
    ? path.join(configDirectory, "state.aerospace.json")
    : yabaiStateFilePath;
}

export function writeState(state: State) {
  const stateFilePath = getStateFilePath();
  getTaskSignal();
  fs.mkdirSync(path.dirname(stateFilePath), { recursive: true });
  fs.writeFileSync(`${stateFilePath}.tmp`, JSON.stringify(state));
  fs.renameSync(`${stateFilePath}.tmp`, stateFilePath);
}

export async function readState(): Promise<State> {
  const stateFilePath = getStateFilePath();
  if (fs.existsSync(stateFilePath)) {
    const data = JSON.parse(fs.readFileSync(stateFilePath).toString()) as State;
    const spaces = await getSpaces();

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
    for (const spaceId of getConfig().windowManager === "aerospace" ? [] : Object.keys(data)) {
      if (!spaces.some((space) => space.id.toString() === spaceId)) {
        delete data[spaceId];
      }
    }

    return data;
  } else {
    const defaultState = Object.create(null) as State;
    const spaces = await getSpaces();

    for (const space of spaces) {
      defaultState[space.id] = { numMasterWindows: 1 };
    }

    writeState(defaultState);
    return defaultState;
  }
}
