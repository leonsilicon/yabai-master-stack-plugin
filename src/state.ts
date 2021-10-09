import fs from 'fs';
import path from 'path';
import pkgDir from 'pkg-dir';

import type { State } from './types';
import { getDisplays } from './utils/display';

const stateFilePath = path.join(pkgDir.sync(__dirname)!, 'state.json');

export function writeState(state: State) {
	fs.writeFileSync(stateFilePath, JSON.stringify(state));
}

export async function readState(): Promise<State> {
	if (fs.existsSync(stateFilePath)) {
		const data = fs.readFileSync(stateFilePath).toString();
		return JSON.parse(data);
	} else {
		const defaultState: State = {};
		const displays = await getDisplays();

		for (const display of displays) {
			defaultState[display.id] = { numMasterWindows: 1 };
		}

		const defaultStateJson = JSON.stringify(defaultState);
		fs.writeFileSync(stateFilePath, defaultStateJson);
		return defaultState;
	}
}
