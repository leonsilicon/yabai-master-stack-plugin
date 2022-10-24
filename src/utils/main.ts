import onExit from 'signal-exit';

import { debug } from './debug.js';
import { acquireHandlerLock, releaseHandlerLock } from './handler.js';

export function handleMasterError(error: Error & { code?: string }) {
	if (error.code === 'ELOCKED') {
		debug(() => 'Lock found...aborting');
	} else {
		console.error(error);
	}
}

onExit(() => {
	releaseHandlerLock();
});

export function defineTask(
	cb: () => Promise<void>,
	options?: { forceReleaseLock?: boolean }
): () => Promise<void> {
	return async () => {
		if (options?.forceReleaseLock) {
			releaseHandlerLock({ force: true });
		}

		acquireHandlerLock();
		cb()
			.catch(handleMasterError)
			.finally(() => {
				releaseHandlerLock();
			});
	};
}
