import { debug } from '#utils/debug.ts';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ymspConfigDirpath = path.join(
	os.homedir(),
	'.config/ymsp',
);
const lockFilepath = path.join(
	ymspConfigDirpath,
	'ymsp.lock',
);

export function defineTask(cb: () => Promise<void>): () => Promise<void> {
	return async () => {
		fs.rmSync(lockFilepath, { force: true, recursive: true });
		fs.writeFileSync(lockFilepath, process.pid.toString());
		return cb().catch(handleMasterError);
	};
}

function handleMasterError(error: Error & { code?: string }) {
	if (error.code === 'ELOCKED') {
		debug(() => 'Lock found...aborting');
	} else {
		console.error(error);
	}
}
