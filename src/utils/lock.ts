import fs from 'fs';
import path from 'path';
import pkgDir from 'pkg-dir';

const handlerLockPath = path.join(pkgDir.sync(__dirname)!, 'handler.lock');
export function acquireHandlerLock() {
	if (fs.existsSync(handlerLockPath)) {
		throw new Error('Failed to acquire handler lock.');
	}
	fs.writeFileSync(handlerLockPath, '');
}

export function releaseLock() {
	try {
		fs.rmSync(handlerLockPath);
	} catch {
		console.error('Failed to release lock: lock not found.');
	}
}
