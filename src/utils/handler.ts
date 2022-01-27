import os from 'node:os';
import path from 'node:path';
import { acquireLock, releaseLock } from './lock.js';

const handlerLockPath = path.join(os.homedir(), '.config/ymsp/handler.lock');

export function acquireHandlerLock() {
	acquireLock(handlerLockPath);
}

export function releaseHandlerLock(options?: { force?: boolean }) {
	releaseLock(handlerLockPath, options);
}
