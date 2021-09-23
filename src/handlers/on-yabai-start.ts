import { readState, writeState } from '../state';
import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { handleMasterError } from '../utils/error';
import { releaseLock } from '../utils/lock';

async function main() {
	try {
		await releaseLock();
		const state = await readState();
		state.numMasterWindows = 1;
		await writeState(state);
		const wm = createWindowsManager({
			display: getFocusedDisplay(),
			expectedCurrentNumMasterWindows: state.numMasterWindows,
		});
		await wm.updateWindows({ targetNumMasterWindows: state.numMasterWindows });
	} catch {
		// empty
	}
}

main().catch(handleMasterError);
