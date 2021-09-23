import { readState } from '../state';
import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { handleMainError } from '../utils/error';
import { acquireHandlerLock, releaseLock } from '../utils/lock';

async function main() {
	return;
	try {
		await acquireHandlerLock();
		const state = await readState();
		const wm = createWindowsManager({
			display: getFocusedDisplay(),
			expectedCurrentNumMainWindows: state.numMainWindows,
		});
		console.log('Starting to handle window_moved.');
		await wm.updateWindows({ targetNumMainWindows: state.numMainWindows });
		console.log('Finished handling window_moved.');
	} finally {
		await releaseLock();
	}
}

main().catch(handleMainError);
