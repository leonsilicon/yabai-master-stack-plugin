import { readState, writeState } from '../state';
import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { acquireHandlerLock, releaseLock } from '../utils/lock';

function main() {
	try {
		acquireHandlerLock();
		const state = readState();
		if (state.numMainWindows > 1) {
			state.numMainWindows = state.numMainWindows - 1;
			writeState(state);
			console.log('Decreasing main window count.');
			const wm = createWindowsManager({ display: getFocusedDisplay() });
			wm.updateWindows();
		}
	} finally {
		releaseLock();
	}
}

main();
