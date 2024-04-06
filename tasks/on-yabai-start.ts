import invariant from 'tiny-invariant';
import { defineTask } from '#utils/task.ts';
import { createInitializedWindowsManager } from '#utils/windows-manager.ts';

export default defineTask(
	async () => {
		const { wm, state, space } = await createInitializedWindowsManager();
		const spaceState = state[space.id];
		invariant(spaceState);
		await wm.updateWindows({
			targetNumMasterWindows: spaceState.numMasterWindows,
		});
	},
	{ forceReleaseLock: true },
);
