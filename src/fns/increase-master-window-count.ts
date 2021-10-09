import { writeState } from '../state';
import { createInitializedWindowsManager } from '../utils';
import { handleMasterError } from '../utils/main';

async function main() {
	const { wm, display, state } = createInitializedWindowsManager();
	if (state[display.id].numMasterWindows < wm.windowsData.length) {
		state[display.id].numMasterWindows += 1;
		writeState(state);
		console.log('Increasing master window count.');
		await wm.updateWindows({
			targetNumMasterWindows: state[display.id].numMasterWindows,
		});
	}
}

main().catch(handleMasterError);
