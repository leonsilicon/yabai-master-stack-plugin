import { readState, writeState } from '../state';
import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { acquireHandlerLock, releaseLock } from '../utils/lock';

async function main() {
	try {
		await acquireHandlerLock();
		const wm = createWindowsManager({ display: getFocusedDisplay() });
		const state = await readState();
		if (state.numMainWindows < wm.windowsData.length) {
			state.numMainWindows += 1;
			await writeState(state);
			console.log('Increasing main window count.');
			await wm.updateWindows();
		}
	} finally {
		await releaseLock();
	}
}

void main();
