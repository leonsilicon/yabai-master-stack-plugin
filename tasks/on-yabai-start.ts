import { defineTask } from '#utils/task.ts';
import { createInitializedWindowsManager } from '#utils/windows-manager.ts';
import invariant from 'tiny-invariant';

export const onYabaiStart = defineTask(
	async () => {
		const { wm, state, space } = await createInitializedWindowsManager();
		const spaceState = state[space.id];
		invariant(spaceState);
		await wm.updateWindows({
			targetNumMasterWindows: spaceState.numMasterWindows,
		});
	},
);
