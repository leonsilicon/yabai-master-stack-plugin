import { readState, writeState } from '../state';
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
		if (state[display.id].numMasterWindows < wm.windowsData.length) {
			state[display.id].numMasterWindows += 1;
			await writeState(state);
			console.log('Increasing master window count.');
			await wm.updateWindows({
				targetNumMasterWindows: state[display.id].numMasterWindows,
			});
		}
	} finally {
		await releaseLock();
	}
}

main().catch(handleMasterError);
