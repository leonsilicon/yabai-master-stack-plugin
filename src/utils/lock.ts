import fs from 'fs';
import onExit from 'signal-exit';

const locks: Record<string, true> = {};

export function releaseLock(lockPath: string, options?: { force?: boolean }) {
	if (options?.force || locks[lockPath]) {
		try {
			fs.rmdirSync(lockPath);
		} catch (error: any) {
			if (error.code !== 'ENOENT') {
				throw error;
			}
		}
	}
}

export function acquireLock(lockPath: string) {
	try {
		fs.mkdirSync(lockPath);
		locks[lockPath] = true;
	} catch (error: any) {
		if (error.code === 'EEXIST') {
			throw new Error('Could not acquire lock.');
		} else {
			throw error;
		}
	}
}

onExit(() => {
	for (const lock of Object.keys(locks)) {
		releaseLock(lock);
	}
});
