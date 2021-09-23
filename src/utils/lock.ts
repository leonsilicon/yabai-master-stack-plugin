import path from 'path';
import pkgDir from 'pkg-dir';
import lockfile from 'proper-lockfile';

const handlerLockPath = path.join(pkgDir.sync(__dirname)!, 'handler.lock');
export function acquireHandlerLock() {
	const isLocked = lockfile.checkSync(handlerLockPath);
	if (isLocked) {
		throw new Error('Could not acquire handler lock file.');
	} else {
		lockfile.lockSync(handlerLockPath);
	}
}

export function releaseLock() {
	lockfile.unlockSync(handlerLockPath);
}
