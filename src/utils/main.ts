import onExit from 'signal-exit';

import { acquireHandlerLock, releaseHandlerLock } from './handler';

export function handleMasterError(error: Error & { code?: string }) {
	if (error.code === 'ELOCKED') {
		console.log('Lock found...aborting');
	} else {
		console.error(error);
	}
}

onExit(() => {
	console.log(`${process.pid} exiting...`);
	releaseHandlerLock();
});

export function main(cb: () => Promise<void>) {
	acquireHandlerLock();
	console.log(`${process.pid} running...`);
	cb()
		.catch(handleMasterError)
		.finally(() => {
			console.log(`${process.pid} ran.`);
			releaseHandlerLock();
		});
}
