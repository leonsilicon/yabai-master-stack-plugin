import { debug } from '#utils/debug.ts';
import { writeState } from '#utils/state.ts';
import { defineTask } from '#utils/task.ts';
import { createInitializedWindowsManager } from '#utils/windows-manager.ts';
import invariant from 'tiny-invariant';

export const decreaseMasterWindowCount = defineTask(async () => {
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

