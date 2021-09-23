import { readState, writeState } from '../state';
import { createWindowsManager } from '../utils';
import { lockOrQuit, releaseLock } from '../utils/lock';

const state = readState();
const wm = createWindowsManager({ numMainWindows: state.numMainWindows });
function main() {
	try {
		lockOrQuit();
		if (state.numMainWindows < wm.windowsData.length) {
			state.numMainWindows += 1;
			writeState(state);
			console.log('Increasing main window count.');
			wm.updateWindows();
		}
	} finally {
		releaseLock();
	}
}

main();
