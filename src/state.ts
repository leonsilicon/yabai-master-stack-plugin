import fs from 'fs';
import path from 'path';
import pkgDir from 'pkg-dir';
import lockfile from 'proper-lockfile';

import type { State } from './types';

const stateFilePath = path.join(pkgDir.sync(__dirname)!, 'state.json');
const stateLockPath = path.join(pkgDir.sync(__dirname)!, 'state.json.lock');

const defaultState: State = { numMainWindows: 1 };
const defaultStateJson = JSON.stringify(defaultState);

let release: () => Promise<void> | undefined;
async function acquireStateLock() {
	if (!fs.existsSync(stateLockPath)) {
		await fs.promises.writeFile(stateLockPath, '');
	}
	release = await lockfile.lock(stateLockPath);
}

async function releaseStateLock() {
	await release?.();
}

export async function writeState(state: State) {
	await acquireStateLock();
	if (!fs.existsSync(stateFilePath)) {
		await fs.promises.writeFile(stateFilePath, defaultStateJson);
	}

	await fs.promises.writeFile(stateFilePath, JSON.stringify(state));
	await releaseStateLock();
}

export async function readState(): Promise<State> {
	await acquireStateLock();
	if (!fs.existsSync(stateFilePath)) {
		await fs.promises.writeFile(stateFilePath, defaultStateJson);
	}
	const data = (await fs.promises.readFile(stateFilePath)).toString();
	await releaseStateLock();

	return JSON.parse(data);
}
