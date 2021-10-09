import path from 'path';
import pkgDir from 'pkg-dir';
import lockfile from 'proper-lockfile';

const handlerLockPath = path.join(pkgDir.sync(__dirname)!, 'package.json');

let release: () => Promise<void> | undefined;
export async function acquireHandlerLock() {
	console.log('Acquiring handler.lock...');
	release = await lockfile.lock(handlerLockPath);
	console.log('Acquired handler.lock');
}

export async function releaseLock() {
	console.log('Releasing handler.lock...');
	await release?.();
	console.log('Released handler.lock');
}
