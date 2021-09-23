import fs from 'fs';
import type { State, Window } from './types';
import pkgDir from 'pkg-dir';
import path from 'path';
import lockfile from 'proper-lockfile';

const stateFilePath = path.join(pkgDir.sync(__dirname)!, 'state.json');
const stateLockPath = path.join(pkgDir.sync(__dirname)!, 'state.json.lock');

const defaultState: State = { numMainWindows: 1 };
const defaultStateJson = JSON.stringify(defaultState);

function acquireStateLock() {
	const isLocked = lockfile.checkSync(stateLockPath);
	if (isLocked) {
		throw new Error('State is locked.');
	} else {
		lockfile.lockSync(stateLockPath)
	}
}

function releaseStateLock() {
	lockfile.unlockSync(stateLockPath);
}

export async function writeState(state: State) {
	acquireStateLock();
	if (!fs.existsSync(stateFilePath)) {
		fs.writeFileSync(stateFilePath, defaultStateJson);
	}

	fs.writeFileSync(stateFilePath, JSON.stringify(state));
	releaseStateLock();
}

export function readState(): State {
	acquireStateLock();
	if (!fs.existsSync(stateFilePath)) {
		fs.writeFileSync(stateFilePath, defaultStateJson);
	}
	const data = fs.readFileSync(stateFilePath).toString();
	releaseStateLock();

	return JSON.parse(data);
}
