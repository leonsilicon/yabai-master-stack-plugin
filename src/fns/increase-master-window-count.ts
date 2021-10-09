import { writeState } from '../state';
import { createInitializedWindowsManager } from '../utils';
import { releaseHandlerLock } from '../utils/handler';
import { handleMasterError } from '../utils/main';

async function main() {
	const { wm, display, state } = createInitializedWindowsManager();
	try {
		if (state[display.id].numMasterWindows < wm.windowsData.length) {
			state[display.id].numMasterWindows += 1;
			writeState(state);
			console.log('Increasing master window count.');
			await wm.updateWindows({
				targetNumMasterWindows: state[display.id].numMasterWindows,
			});
		}
	} finally {
		releaseHandlerLock();
	}
}

main().catch(handleMasterError);
