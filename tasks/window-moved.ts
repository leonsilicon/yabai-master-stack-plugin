import { debug } from '#utils/debug.ts';
import {
	defineTask,
} from '#utils/task.ts';
import { createInitializedWindowsManager } from '#utils/windows-manager.ts';
import invariant from 'tiny-invariant';

export const windowMoved = defineTask(async () => {
	const { wm, space, state } = await createInitializedWindowsManager();
	debug(() => 'Starting to handle window_moved.');
	const spaceState = state[space.id];
	invariant(spaceState);
	await wm.updateWindows({
		targetNumMasterWindows: spaceState.numMasterWindows,
	});
	debug(() => 'Finished handling window_moved.');
});
