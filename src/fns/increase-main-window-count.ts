import { readState, windowsData, writeState } from '../state';
import { updateWindows } from '../utils';
import { lockOrQuit, releaseLock } from '../utils/lock';

function main() {
	try {
		lockOrQuit();
		const state = readState();
		if (state.numMainWindows < windowsData.length) {
			state.numMainWindows += 1;
			writeState(state);
			console.log('Increasing main window count.');
			updateWindows();
		}
	} finally {
		releaseLock();
	}
}

main();
