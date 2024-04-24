import fs from 'node:fs';
import os from 'node:os';
import path from 'pathe';
import { lock } from 'proper-lockfile';

const ymspConfigDirpath = path.join(os.homedir(), '.config/ymsp');
const lockfilePath = path.join(ymspConfigDirpath, 'ymsp.lock');

export async function acquireLock() {
	fs.mkdirSync(lockfilePath, { recursive: true });
	return lock(ymspConfigDirpath, {
		lockfilePath,
		stale: 200,
		retries: 3,
	});
}
