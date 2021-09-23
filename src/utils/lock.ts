import path from 'path';
import pkgDir from 'pkg-dir';
import lockfile from 'proper-lockfile';

const handlerLockPath = path.join(pkgDir.sync(__dirname)!, 'handler.lock');
let release: () => Promise<void> | undefined;
export async function acquireHandlerLock() {
	release = await lockfile.lock(handlerLockPath);
}

export async function releaseLock() {
	await release?.();
}
