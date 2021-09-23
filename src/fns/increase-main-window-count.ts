import { readState, writeState } from '../state';
import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { lockOrQuit, releaseLock } from '../utils/lock';

function main() {
	try {
		lockOrQuit();
		const wm = createWindowsManager({ display: getFocusedDisplay() });
		const state = readState();
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
