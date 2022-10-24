import invariant from 'tiny-invariant';

import {
	createInitializedWindowsManager,
	debug,
	defineTask,
} from '../utils/index.js';

const windowMoved = defineTask(async () => {
	const { wm, space, state } = await createInitializedWindowsManager();
	debug(() => 'Starting to handle window_moved.');
	const spaceState = state[space.id];
	invariant(spaceState);
	await wm.updateWindows({
		targetNumMasterWindows: spaceState.numMasterWindows,
	});
	debug(() => 'Finished handling window_moved.');
});

export default windowMoved;
