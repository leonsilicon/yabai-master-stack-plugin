import fs from 'node:fs';
import os from 'node:os';
import path from 'pathe';
import { lockSync } from 'proper-lockfile';

const ymspConfigDirpath = path.join(os.homedir(), '.config/ymsp');
const lockfilePath = path.join(ymspConfigDirpath, 'ymsp.lock');

export function acquireLock() {
	fs.mkdirSync(ymspConfigDirpath, { recursive: true });
	try {
		return lockSync(ymspConfigDirpath, { lockfilePath });
	} catch (error: unknown) {
		const err = error as { code: string };
		if (err.code === 'EEXIST') {
			throw new Error('Could not acquire lock.');
		} else {
			throw error;
		}
	}
}
