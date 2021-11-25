import { debug } from '../config';

export function logDebug(cb: () => unknown) {
	if (debug) {
		console.info(cb());
	}
}

export function logTime(label: string) {
	if (debug) {
		console.time(label);
	}
}

export function logTimeEnd(label: string) {
	if (debug) {
		console.timeEnd(label);
	}
}