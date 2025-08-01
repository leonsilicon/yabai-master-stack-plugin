import type { State } from "#types";
import fs from "node:fs";
import os from "node:os";
import path from "pathe";
import { getSpaces } from "./space.ts";
import { debug } from "./debug.ts";

const stateFilePath = path.join(os.homedir(), ".config/ymsp/state.json");

export function writeState(state: State) {
	fs.writeFileSync(stateFilePath, JSON.stringify(state));
}

export async function readState(): Promise<State> {
	debug(() => `Reading state from: ${stateFilePath}`);

	if (fs.existsSync(stateFilePath)) {
		try {
			const data = JSON.parse(
				fs.readFileSync(stateFilePath).toString()
			) as State;
			const spaces = await getSpaces();

			debug(
				() =>
					`Loaded state with ${Object.keys(data).length} spaces, found ${
						spaces.length
					} current spaces`
			);

			// Set the default numMasterWindows of each unknown space to 1
			for (const space of spaces) {
				if (data[space.id.toString()] === undefined) {
					data[space.id.toString()] = { numMasterWindows: 1 };
					debug(() => `Added default state for space ${space.id}`);
				}
			}

			// Remove spaces that no longer exist
			const currentSpaceIds = new Set(spaces.map(space => space.id.toString()));
			for (const spaceId of Object.keys(data)) {
				if (!currentSpaceIds.has(spaceId)) {
					delete data[spaceId];
					debug(() => `Removed state for non-existent space ${spaceId}`);
				}
			}

			return data;
		} catch (error) {
			debug(() => `Error reading state file: ${error}`);
			// If the state file is corrupted, start fresh
			fs.unlinkSync(stateFilePath);
			return await readState(); // Recursive call to create new state
		}
	} else {
		debug(() => `State file not found, creating default state`);
		const defaultState: State = {};
		const spaces = await getSpaces();

		for (const space of spaces) {
			defaultState[space.id] = { numMasterWindows: 1 };
		}

		const defaultStateJson = JSON.stringify(defaultState);
		fs.writeFileSync(stateFilePath, defaultStateJson);
		debug(
			() =>
				`Created default state with ${Object.keys(defaultState).length} spaces`
		);
		return defaultState;
	}
}
