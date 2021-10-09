import { writeState } from '../state';
import { createInitializedWindowsManager } from '../utils';
import { releaseHandlerLock } from '../utils/handler';
import { handleMasterError } from '../utils/main';

async function main() {
	const { wm, state, display } = createInitializedWindowsManager();
	try {
		// Update the state
		state[display.id].numMasterWindows -= 1;
		writeState(state);
		console.log('Decreasing master window count.');
		await wm.updateWindows({
			targetNumMasterWindows: state[display.id].numMasterWindows,
		});
	} finally {
		releaseHandlerLock();
	}
}

main().catch(handleMasterError);
