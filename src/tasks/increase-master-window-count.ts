import invariant from 'tiny-invariant';

import {
	createInitializedWindowsManager,
	debug,
	defineTask,
	writeState,
} from '../utils/index.js';

const increaseMasterWindowCount = defineTask(async () => {
	const { wm, space, state } = await createInitializedWindowsManager();
	const spaceState = state[space.id];
	invariant(spaceState);
	if (spaceState.numMasterWindows < wm.windowsData.length) {
		spaceState.numMasterWindows += 1;
		writeState(state);
		debug(() => 'Increasing master window count.');
		await wm.updateWindows({
			targetNumMasterWindows: spaceState.numMasterWindows,
		});
	}
});

export default increaseMasterWindowCount;
