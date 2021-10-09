import { writeState } from '../state';
import { createInitializedWindowsManager } from '../utils';
import { handleMasterError } from '../utils/error';
import { releaseLock } from '../utils/lock';

async function main() {
	try {
		const { wm, state, display } = await createInitializedWindowsManager();
		// Update the state
		state[display.id].numMasterWindows -= 1;
		await writeState(state);
		console.log('Decreasing master window count.');
		await wm.updateWindows({
			targetNumMasterWindows: state[display.id].numMasterWindows,
		});
	} finally {
		await releaseLock();
	}
}

main().catch(handleMasterError);
