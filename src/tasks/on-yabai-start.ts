import invariant from 'tiny-invariant';

import { createInitializedWindowsManager, defineTask } from '../utils/index.js';

defineTask(
	async () => {
		const { wm, state, space } = await createInitializedWindowsManager();
		const spaceState = state[space.id];
		invariant(spaceState);
		await wm.updateWindows({
			targetNumMasterWindows: spaceState.numMasterWindows,
		});
	},
	{ forceReleaseLock: true }
);
