import { writeState } from '../state';
import { createInitializedWindowsManager } from '../utils';
import { logDebug } from '../utils/log';
import { main } from '../utils/main';

main(async () => {
	const { wm, state, display } = await createInitializedWindowsManager();

	if (state[display.id].numMasterWindows > 1) {
		// Update the state
		state[display.id].numMasterWindows -= 1;
		writeState(state);
		logDebug(() => 'Decreasing master window count.');
		await wm.updateWindows({
			targetNumMasterWindows: state[display.id].numMasterWindows,
		});
	}
});
