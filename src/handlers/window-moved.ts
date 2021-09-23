import { readState } from '../state';
import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { handleMasterError } from '../utils/error';
import { acquireHandlerLock, releaseLock } from '../utils/lock';

async function master() {
	try {
		await acquireHandlerLock();
		const state = await readState();
		const wm = createWindowsManager({
			display: getFocusedDisplay(),
			expectedCurrentNumMasterWindows: state.numMasterWindows,
		});
		console.log('Starting to handle window_moved.');
		await wm.updateWindows({ targetNumMasterWindows: state.numMasterWindows });
		console.log('Finished handling window_moved.');
	} finally {
		await releaseLock();
	}
}

master().catch(handleMasterError);
