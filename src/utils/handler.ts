import { acquireLock, releaseLock } from "./lock";

const handlerLockPath = 'handler.lock';

export async function acquireHandlerLock() {
	await acquireLock(handlerLockPath);
}

export async function releaseHandlerLock() {
	await releaseLock(handlerLockPath);
}