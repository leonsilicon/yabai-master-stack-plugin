import fs from 'node:fs';
import os from 'node:os';
import path from 'pathe';

const locks = new Map<string, true>();

export function releaseLock(lockPath: string, options?: { force?: boolean }) {
	const force = options?.force ?? false;
	if (force || locks.has(lockPath)) {
		try {
			fs.rmdirSync(lockPath);
			locks.delete(lockPath);
		} catch (error: unknown) {
			const err = error as { code: string };
			if (err.code !== 'ENOENT') {
				throw error;
			}
		}
	}
}

export function acquireLock(lockPath: string) {
	try {
		// Using mkdir to create the lock because it is an atomic operation
		fs.mkdirSync(lockPath);
		locks.set(lockPath, true);
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
