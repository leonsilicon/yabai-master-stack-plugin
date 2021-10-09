import { createInitializedWindowsManager } from '../utils';
import { main } from '../utils/main';

main(async () => {
	const { wm } = createInitializedWindowsManager();
	const focusedWindow = wm.getFocusedWindow();
	if (focusedWindow !== undefined) {
		// If the focused window is the highest window
		if (
			wm.isMasterWindow(focusedWindow) &&
			wm.isTopWindow(wm.getMasterWindows(), focusedWindow)
		) {
			// Focus on the bottom stack window
			const windowToFocus =
				wm.getBottomStackWindow() ?? wm.getBottomMasterWindow();
			console.log(`Focusing on the window ${windowToFocus.app}`);
			if (windowToFocus !== undefined) {
				await wm.executeYabaiCommand(`-m window --focus ${windowToFocus.id}`);
			}
		} else if (
			wm.isStackWindow(focusedWindow) &&
			wm.isTopWindow(wm.getStackWindows(), focusedWindow)
		) {
			// Focus on the bottom master window
			const windowToFocus = wm.getBottomMasterWindow();
			console.log(`Focusing on the window ${windowToFocus.app}`);
			if (windowToFocus !== undefined) {
				await wm.executeYabaiCommand(`-m window --focus ${windowToFocus.id}`);
			}
		} else {
			// Otherwise, just focus north
			await wm.executeYabaiCommand(`-m window --focus north`);
		}
	}
});
