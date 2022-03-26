import fs from 'node:fs';
import path from 'node:path';

import os from 'node:os';
import type { State } from '../types/index.js';
import { getSpaces } from './space.js';

const stateFilePath = path.join(os.homedir(), '.config/ymsp/state.json');

export function writeState(state: State) {
	fs.writeFileSync(stateFilePath, JSON.stringify(state));
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
		for (const spaceId of Object.keys(spaces)) {
			if (!spaces.some((space) => space.id.toString() === spaceId)) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				data[spaceId] = undefined as any;
			}
		}

		return data;
	} else {
		const defaultState: State = {};
		const spaces = await getSpaces();

		for (const space of spaces) {
			defaultState[space.id] = { numMasterWindows: 1 };
		}

		const defaultStateJson = JSON.stringify(defaultState);
		fs.writeFileSync(stateFilePath, defaultStateJson);
		return defaultState;
	}
}
