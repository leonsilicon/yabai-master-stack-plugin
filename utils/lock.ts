import fs from 'node:fs';
import os from 'node:os';
import path from 'pathe';
import { lockSync, unlockSync } from 'proper-lockfile';

export function releaseLock(lockPath: string, options?: { force?: boolean }) {
	if (options?.force) {
		try {
			fs.rmdirSync(lockPath);
		} catch {}
	}

	try {
		unlockSync(lockPath);
	} catch (error: unknown) {
		const err = error as { code: string };
		if (err.code !== 'ENOENT') {
			throw error;
		}
	}
}

export function acquireLock(lockPath: string) {
	try {
		lockSync(lockPath);
	} catch (error: unknown) {
		const err = error as { code: string };
		if (err.code === 'EEXIST') {
			throw new Error('Could not acquire lock.');
		} else {
			throw error;
		}
	}
}

const handlerLockPath = path.join(os.homedir(), '.config/ymsp/handler.lock');

export function acquireHandlerLock() {
	acquireLock(handlerLockPath);
}

export function releaseHandlerLock(options?: { force?: boolean }) {
	releaseLock(handlerLockPath, options);
}
