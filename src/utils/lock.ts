import fs from 'fs';

const locks: Record<string, true> = {};

export function releaseLock(lockPath: string) {
	if (locks[lockPath]) {
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
