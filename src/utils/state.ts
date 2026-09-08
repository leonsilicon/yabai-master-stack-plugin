import type { State } from "#types";
import fs from "node:fs";
import os from "node:os";
import path from "pathe";
import { getSpaces } from "./space.ts";

const stateFilePath = path.join(os.homedir(), ".config/ymsp/state.json");

export function writeState(state: State) {
  fs.mkdirSync(path.dirname(stateFilePath), { recursive: true });
  fs.writeFileSync(`${stateFilePath}.tmp`, JSON.stringify(state));
  fs.renameSync(`${stateFilePath}.tmp`, stateFilePath);
}

export async function readState(): Promise<State> {
  if (fs.existsSync(stateFilePath)) {
    const data = JSON.parse(fs.readFileSync(stateFilePath).toString()) as State;
    const spaces = await getSpaces();

    // Set the default numMasterWindows of each unknown space to 1
    for (const space of spaces) {
      if (data[space.id.toString()] === undefined) {
        data[space.id.toString()] = { numMasterWindows: 1 };
      }
    }

    // Delete unknown spaces
    for (const spaceId of Object.keys(data)) {
      if (!spaces.some((space) => space.id.toString() === spaceId)) {
        delete data[spaceId];
      }
    }

    return data;
  } else {
    const defaultState: State = {};
    const spaces = await getSpaces();

    for (const space of spaces) {
      defaultState[space.id] = { numMasterWindows: 1 };
    }

    writeState(defaultState);
    return defaultState;
  }
}
