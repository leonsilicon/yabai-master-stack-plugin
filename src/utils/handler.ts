import path from 'path';
import pkgDir from 'pkg-dir';

import { acquireLock, releaseLock } from './lock';

const handlerLockPath = path.join(pkgDir.sync(__dirname)!, 'handler.lock');

export function acquireHandlerLock() {
	console.log(`${process.pid} acquiring handler lock...`);
	acquireLock(handlerLockPath);
	console.log(`${process.pid} acquired handler lock.`);
}

export function releaseHandlerLock(options?: { force?: boolean }) {
	console.log(`${process.pid} releasing handler lock...`);
	releaseLock(handlerLockPath, options);
	console.log(`${process.pid} released handler lock.`);
}
