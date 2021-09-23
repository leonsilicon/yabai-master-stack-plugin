import { readState, writeState } from '../state';
import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { handleMasterError } from '../utils/error';
import { acquireHandlerLock, releaseLock } from '../utils/lock';

async function main() {
	try {
		await acquireHandlerLock();
		const state = await readState();
		const wm = createWindowsManager({
			display: getFocusedDisplay(),
			expectedCurrentNumMasterWindows: state.numMasterWindows,
		});
		if (state.numMasterWindows < wm.windowsData.length) {
			state.numMasterWindows += 1;
			await writeState(state);
			console.log('Increasing master window count.');
			await wm.updateWindows({ targetNumMasterWindows: state.numMasterWindows });
		}
	} finally {
		await releaseLock();
	}
}

main().catch(handleMasterError);
