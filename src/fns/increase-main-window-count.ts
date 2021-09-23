import { readState, writeState } from '../state';
import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { handleMainError } from '../utils/error';
import { acquireHandlerLock, releaseLock } from '../utils/lock';

async function main() {
	try {
		await acquireHandlerLock();
		const state = await readState();
		const wm = createWindowsManager({
			display: getFocusedDisplay(),
			numMainWindows: state.numMainWindows,
		});
		if (state.numMainWindows < wm.windowsData.length) {
			state.numMainWindows += 1;
			wm.expectedNumMainWindows += 1;
			await writeState(state);
			console.log('Increasing main window count.');
			await wm.updateWindows();
		}
	} finally {
		await releaseLock();
	}
}

main().catch(handleMainError);
