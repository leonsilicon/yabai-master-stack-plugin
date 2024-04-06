import { getConfig } from '#utils/config.ts';
import { debug } from '#utils/debug.ts';
import { defineTask } from '#utils/task.ts';
import { createInitializedWindowsManager } from '#utils/windows-manager.ts';
import process from 'node:process';
import invariant from 'tiny-invariant';

const windowCreated = defineTask(async () => {
	const { wm, state, space } = await createInitializedWindowsManager();
	debug(() => 'Starting to handle window_created.');

	const result = await wm.isValidLayout();
	if (result.status) {
		debug(() => 'Valid layout detected; no changes were made.');
		return;
	}

	const processId = process.env.YABAI_PROCESS_ID!;
	const windowId = process.env.YABAI_WINDOW_ID!;
	const curNumMasterWindows = wm.getMasterWindows().length;
	const window = wm.getWindowData({ windowId, processId });

	const spaceState = state[space.id];
	invariant(spaceState);
	if (getConfig().moveNewWindowsToMaster) {
		// If the master is full, move a window from master to stack
		if (curNumMasterWindows >= spaceState.numMasterWindows) {
			const oldMasterWindow = wm.getMasterWindows()[0];
			invariant(oldMasterWindow);
			await wm.moveWindowToMaster(window);
			await wm.moveWindowToStack(oldMasterWindow);
		} else {
			await wm.moveWindowToMaster(window);
		}
	} else if (
		curNumMasterWindows > 1 &&
		curNumMasterWindows <= spaceState.numMasterWindows
	) {
		// Move the window to the master
		debug(() => 'Moving newly created window to master.');
		await wm.moveWindowToMaster(window);
	} // If there are too many windows on the master
	else {
		debug(() => 'Moving newly created window to stack.');
		// Move the window to the stack
		await wm.moveWindowToStack(window);
	}

	await wm.updateWindows({
		targetNumMasterWindows: spaceState.numMasterWindows,
	});
	debug(() => 'Finished handling window_created.');
});

export default windowCreated;
