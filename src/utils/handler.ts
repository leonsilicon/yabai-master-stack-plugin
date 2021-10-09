import path from 'path';
import pkgDir from 'pkg-dir';

import { acquireLock, releaseLock } from './lock';

const handlerLockPath = path.join(pkgDir.sync(__dirname)!, 'handler.lock');

export async function acquireHandlerLock() {
	await acquireLock(handlerLockPath);
}

export async function releaseHandlerLock() {
	await releaseLock(handlerLockPath);
}
