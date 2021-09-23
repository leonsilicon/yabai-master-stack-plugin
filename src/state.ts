import fs from 'fs';
import type { State, Window } from './types';
import pkgDir from 'pkg-dir';
import path from 'path';

const stateFilePath = path.join(pkgDir.sync(__dirname)!, 'state.json');
const stateLockPath = path.join(pkgDir.sync(__dirname)!, 'state.json.lock');

const defaultState: State = { numMainWindows: 1 };
const defaultStateJson = JSON.stringify(defaultState);

function acquireStateLock() {
	if (fs.existsSync(stateLockPath)) {
		throw new Error('State is locked.');
	}
	fs.writeFileSync(stateLockPath, '');
}

function releaseStateLock() {
	try {
		fs.rmSync(stateLockPath);
	} catch {}
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
