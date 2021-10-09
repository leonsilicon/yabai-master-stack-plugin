import path from 'path';
import pkgDir from 'pkg-dir';
import onExit from 'signal-exit';

import { acquireLock, releaseLock } from './lock';

const handlerLockPath = path.join(pkgDir.sync(__dirname)!, 'handler.lock');

export function acquireHandlerLock() {
	acquireLock(handlerLockPath);
}

export function releaseHandlerLock() {
	releaseLock(handlerLockPath);
}

onExit(releaseHandlerLock);
