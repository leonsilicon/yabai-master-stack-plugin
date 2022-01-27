import { debug } from './config.js';

export function logDebug(cb: () => unknown) {
	if (debug) {
		console.info(cb());
	}
}
