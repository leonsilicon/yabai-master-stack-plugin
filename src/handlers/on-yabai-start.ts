import { readState, resetState } from '../state';
import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { handleMasterError } from '../utils/error';
import { releaseLock } from '../utils/lock';

async function main() {
	try {
		await releaseLock();
		await resetState();
		const state = await readState();
		const display = getFocusedDisplay();
		const wm = createWindowsManager({
			display,
			expectedCurrentNumMasterWindows: state[display.id].numMasterWindows,
		});
		await wm.updateWindows({
			targetNumMasterWindows: state[display.id].numMasterWindows,
		});
	} catch {
		// empty
	}
}

main().catch(handleMasterError);
