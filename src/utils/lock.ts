import fs from 'fs';
import path from 'path';
import pkgDir from 'pkg-dir';

const handlerLockPath = path.join(pkgDir.sync(__dirname)!, 'handler.lock');
export function lockOrQuit() {
	if (fs.existsSync(handlerLockPath)) {
		console.log('Lock found...quitting.')
		process.exit(1);
	}
	fs.writeFileSync(handlerLockPath, '');
}

export function releaseLock() {
	try {
		fs.rmSync(handlerLockPath);
	} catch {
		console.error('Failed to release lock: lock not found.')
	}
}
