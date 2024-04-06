import { debug } from '#utils/debug.ts';
import { acquireHandlerLock, releaseHandlerLock } from '#utils/lock.ts';

export function defineTask(
	cb: () => Promise<void>,
	options?: { forceReleaseLock?: boolean },
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

function handleMasterError(error: Error & { code?: string }) {
	if (error.code === 'ELOCKED') {
		debug(() => 'Lock found...aborting');
	} else {
		console.error(error);
	}
}
