import path from 'node:path';
import { packageDirectorySync } from 'pkg-dir';

import { acquireLock, releaseLock } from './lock';

const handlerLockPath = path.join(packageDirectorySync(), 'handler.lock');

export function acquireHandlerLock() {
	acquireLock(handlerLockPath);
}

export function releaseHandlerLock(options?: { force?: boolean }) {
	releaseLock(handlerLockPath, options);
}
