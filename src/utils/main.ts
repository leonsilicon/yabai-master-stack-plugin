import onExit from 'signal-exit';

import { acquireHandlerLock, releaseHandlerLock } from './handler';

export function handleMasterError(error: Error & { code?: string }) {
	if (error.code === 'ELOCKED') {
		console.log('Lock found...aborting');
	} else {
		console.error(error);
	}
}

export function main(cb: () => Promise<void>) {
	acquireHandlerLock();
	onExit(() => {
		releaseHandlerLock();
	});
	try {
		cb().catch(handleMasterError);
	} finally {
		releaseHandlerLock();
	}
}
