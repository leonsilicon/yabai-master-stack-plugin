import { writeState } from '../state';
import { createInitializedWindowsManager } from '../utils';
import { releaseHandlerLock } from '../utils/handler';
import { handleMasterError } from '../utils/main';

async function main() {
	const { wm, state, display } = await createInitializedWindowsManager();
	try {
		// Update the state
		state[display.id].numMasterWindows -= 1;
		await writeState(state);
		console.log('Decreasing master window count.');
		await wm.updateWindows({
			targetNumMasterWindows: state[display.id].numMasterWindows,
		});
	} finally {
		await releaseHandlerLock();
	}
}

main().catch(handleMasterError);
