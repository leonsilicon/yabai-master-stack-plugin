import { debug } from '#utils/debug.ts';
import { acquireLock } from './lock.ts';

export function defineTask(
	cb: () => Promise<void>,
	options?: { ignoreLock?: boolean },
): () => Promise<void> {
	return async () => {
		if (options?.ignoreLock) {
			return cb();
		} else {
			return acquireLock()
				.then(async (releaseLock) =>
					cb()
						.catch(handleMasterError)
						.finally(() => {
							releaseLock();
						})
				);
		}
	};
}

function handleMasterError(error: Error & { code?: string }) {
	if (error.code === 'ELOCKED') {
		debug(() => 'Lock found...aborting');
	} else {
		console.error(error);
	}
}
