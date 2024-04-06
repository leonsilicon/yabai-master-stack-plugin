import { debug } from '#utils/debug.ts';
import { defineTask } from '#utils/task.ts';
import { createInitializedWindowsManager } from '#utils/windows-manager.ts';

const focusUpWindow = defineTask(async () => {
	const { wm } = await createInitializedWindowsManager();
	const focusedWindow = wm.getFocusedWindow();
	if (focusedWindow !== undefined) {
		// If the focused window is the highest window
		if (
			wm.isMasterWindow(focusedWindow) &&
			wm.isTopWindow(wm.getMasterWindows(), focusedWindow)
		) {
			// Focus on the bottom stack window
			const windowToFocus = wm.getBottomStackWindow() ??
				wm.getBottomMasterWindow();
			if (windowToFocus === undefined) {
				debug(() => `No window to focus on`);
			} else {
				debug(() => `Focusing on the window ${windowToFocus.app}`);
				await wm.executeYabaiCommand(`-m window --focus ${windowToFocus.id}`);
			}
		} else if (
			wm.isStackWindow(focusedWindow) &&
			wm.isTopWindow(wm.getStackWindows(), focusedWindow)
		) {
			// Focus on the bottom master window
			const windowToFocus = wm.getBottomMasterWindow();
			if (windowToFocus === undefined) {
				debug(() => `No window to focus on`);
			} else {
				debug(() => `Focusing on the window ${windowToFocus.app}`);
				await wm.executeYabaiCommand(`-m window --focus ${windowToFocus.id}`);
			}
		} else {
			// Otherwise, just focus north
			await wm.executeYabaiCommand(`-m window --focus north`);
		}
	}
});

export default focusUpWindow;
