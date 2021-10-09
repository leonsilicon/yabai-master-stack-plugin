import { writeState } from '../state';
import { createInitializedWindowsManager } from '../utils';
import { main } from '../utils/main';

main(async () => {
	const { wm, state, display } = await createInitializedWindowsManager();
	// Update the state
	state[display.id].numMasterWindows -= 1;
	writeState(state);
	console.log('Decreasing master window count.');
	await wm.updateWindows({
		targetNumMasterWindows: state[display.id].numMasterWindows,
	});
});
