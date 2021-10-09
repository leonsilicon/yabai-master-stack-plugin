import { writeState } from '../state';
import { createInitializedWindowsManager } from '../utils';
import { handleMasterError } from '../utils/error';
import { releaseLock } from '../utils/lock';

async function main() {
	try {
		const { wm, display, state } = await createInitializedWindowsManager();
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
