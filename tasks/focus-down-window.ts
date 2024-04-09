import { debug } from '#utils/debug.ts';
import { defineTask } from '#utils/task.ts';
import {
	createInitializedWindowsManager,
} from '#utils/windows-manager.ts';

export const focusDownWindow = defineTask(async () => {
	const { wm } = await createInitializedWindowsManager();
	const focusedWindow = wm.getFocusedWindow();
	// eslint-disable-next-line no-negated-condition
	if (focusedWindow !== undefined) {
		// If the focused window is the lowest master window
		if (
			wm.isMasterWindow(focusedWindow) &&
			wm.isBottomWindow(wm.getMasterWindows(), focusedWindow)
		) {
			// Focus on the top stack window
			const windowToFocus = wm.getTopStackWindow() ?? wm.getTopMasterWindow();
			if (windowToFocus === undefined) {
				debug(() => `Now window to focus on`);
			} else {
				debug(() => `Focusing on the window ${windowToFocus.app}`);
				await wm.executeYabaiCommand(`-m window --focus ${windowToFocus.id}`);
			}
		} else if (
			wm.isStackWindow(focusedWindow) &&
			wm.isBottomWindow(wm.getStackWindows(), focusedWindow)
		) {
			// Focus on the top master window
			const windowToFocus = wm.getTopMasterWindow();
			if (windowToFocus === undefined) {
				debug(() => `No window to focus on`);
			} else {
				debug(() => `Focusing on the window ${windowToFocus.app}`);
				await wm.executeYabaiCommand(`-m window --focus ${windowToFocus.id}`);
			}
		} // Otherwise, just focus south
		else {
			await wm.executeYabaiCommand(`-m window --focus south`);
		}
	} else {
		await wm.executeYabaiCommand(`-m window --focus first`);
	}
});
