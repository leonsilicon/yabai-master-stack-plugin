import { debug } from '#utils/debug.ts';
import { writeState } from '#utils/state.ts';
import { defineTask } from '#utils/task.ts';
import { createInitializedWindowsManager } from '#utils/windows-manager.ts';
import invariant from 'tiny-invariant';

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
