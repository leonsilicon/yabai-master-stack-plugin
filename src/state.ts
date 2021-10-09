import fs from 'fs';
import path from 'path';
import pkgDir from 'pkg-dir';

import type { State } from './types';
import { getDisplays } from './utils/display';
import { acquireLock, releaseLock } from './utils/lock';

const stateFilePath = path.join(pkgDir.sync(__dirname)!, 'state.json');
const stateLockPath = path.join(pkgDir.sync(__dirname)!, 'state.json.lock');

const displays = getDisplays();
const defaultState: State = {};
for (const display of displays) {
	defaultState[display.id] = { numMasterWindows: 1 };
}

const defaultStateJson = JSON.stringify(defaultState);

function acquireStateLock() {
	acquireLock(stateLockPath);
}

export function releaseStateLock(options?: { force: boolean }) {
	releaseLock(stateLockPath, options);
}

export function resetState() {
	acquireStateLock();
	fs.writeFileSync(stateFilePath, defaultStateJson);
	releaseStateLock();
}

export function writeState(state: State) {
	acquireStateLock();
	fs.writeFileSync(stateFilePath, JSON.stringify(state));
	releaseStateLock();
}

export function readState(): State {
	acquireStateLock();
	const data = fs.readFileSync(stateFilePath).toString();
	releaseStateLock();

	return JSON.parse(data);
}
