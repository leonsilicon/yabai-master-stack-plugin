import fs from 'fs';
import path from 'path';
import pkgDir from 'pkg-dir';

import type { State } from './types';
import { getDisplays } from './utils/display';

const stateFilePath = path.join(pkgDir.sync(__dirname)!, 'state.json');

const displays = getDisplays();
const defaultState: State = {};
for (const display of displays) {
	defaultState[display.id] = { numMasterWindows: 1 };
}

const defaultStateJson = JSON.stringify(defaultState);

export function resetState() {
	fs.writeFileSync(stateFilePath, defaultStateJson);
}

export function writeState(state: State) {
	fs.writeFileSync(stateFilePath, JSON.stringify(state));
}

export function readState(): State {
	const data = fs.readFileSync(stateFilePath).toString();

	return JSON.parse(data);
}
