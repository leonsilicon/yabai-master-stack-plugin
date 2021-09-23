import { readState, writeState } from '../state';
import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { acquireHandlerLock, releaseLock } from '../utils/lock';

async function main() {
	try {
		await acquireHandlerLock();
		const state = await readState();
		if (state.numMainWindows > 1) {
			state.numMainWindows -= 1;
			await writeState(state);
			console.log('Decreasing main window count.');
			const wm = createWindowsManager({ display: getFocusedDisplay() });
			await wm.updateWindows();
		}
	} finally {
		await releaseLock();
	}
}

void main();
