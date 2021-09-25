import { readState } from '../state';
import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { handleMasterError } from '../utils/error';
import { acquireHandlerLock, releaseLock } from '../utils/lock';

async function main() {
	try {
		await acquireHandlerLock();
		const state = await readState();
		const display = getFocusedDisplay();
		const wm = createWindowsManager({
			display,
			expectedCurrentNumMasterWindows: state[display.id].numMasterWindows,
		});
		console.log('Starting to handle window_moved.');
		await wm.updateWindows({
			targetNumMasterWindows: state[display.id].numMasterWindows,
		});
		console.log('Finished handling window_moved.');
	} finally {
		await releaseLock();
	}
}

main().catch(handleMasterError);
