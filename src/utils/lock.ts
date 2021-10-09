import fs from 'fs';

export async function releaseLock(lockPath: string) {
	try {
		await fs.promises.rmdir(lockPath);
	} catch (error: any) {
		if (error.code !== 'ENOENT') {
			throw error;
		}
	}
}

export async function acquireLock(lockPath: string) {
	try {
		await fs.promises.mkdir(lockPath);
	} catch (error: any) {
		if (error.code === 'EEXISTS') {
			throw new Error('Could not acquire lock.');
		}
	}
}
