import fs from 'fs';

export function releaseLock(lockPath: string) {
	try {
		fs.rmdirSync(lockPath);
	} catch (error: any) {
		if (error.code !== 'ENOENT') {
			throw error;
		}
	}
}

export function acquireLock(lockPath: string) {
	try {
		fs.mkdirSync(lockPath);
	} catch (error: any) {
		if (error.code === 'EEXIST') {
			throw new Error('Could not acquire lock.');
		} else {
			throw error;
		}
	}
}
