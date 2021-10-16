import { writeState } from '../state';
import { createInitializedWindowsManager } from '../utils';
import { logDebug } from '../utils/log';
import { main } from '../utils/main';

main(async () => {
	const { wm, display, state } = await createInitializedWindowsManager();
	if (state[display.id].numMasterWindows < wm.windowsData.length - 1) {
		state[display.id].numMasterWindows += 1;
		writeState(state);
		logDebug(() => 'Increasing master window count.');
		await wm.updateWindows({
			targetNumMasterWindows: state[display.id].numMasterWindows,
		});
	}
});
