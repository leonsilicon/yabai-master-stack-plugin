import { readState } from '../state';
import { createWindowsManager } from '../utils';
import { lockOrQuit, releaseLock } from '../utils/lock';

function main() {
	try {
		const state = readState();
		const wm = createWindowsManager({ numMainWindows: state.numMainWindows });
		lockOrQuit();
		console.log('Starting to handle window_moved.');
		wm.updateWindows();
		console.log('Finished handling window_moved.');
	} finally {
		releaseLock();
	}
}

main();
