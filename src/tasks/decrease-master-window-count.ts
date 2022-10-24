import invariant from 'tiny-invariant';

import {
	createInitializedWindowsManager,
	debug,
	defineTask,
	writeState,
} from '../utils/index.js';

const decreaseMasterWindowCount = defineTask(async () => {
	const { wm, state, space } = await createInitializedWindowsManager();

	const spaceState = state[space.id];
	invariant(spaceState);
	if (spaceState.numMasterWindows > 1) {
		// Update the state
		spaceState.numMasterWindows -= 1;
		writeState(state);
		debug(() => 'Decreasing master window count.');
		await wm.updateWindows({
			targetNumMasterWindows: spaceState.numMasterWindows,
		});
	}
});

export default decreaseMasterWindowCount;
