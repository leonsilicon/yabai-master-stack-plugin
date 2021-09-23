import { yabaiPath } from '../config';
import { readState } from '../state';
import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { handleMainError } from '../utils/error';

async function main() {
	const state = await readState();
	const wm = createWindowsManager({
		display: getFocusedDisplay(),
		numMainWindows: state.numMainWindows,
	});
	const focusedWindow = wm.getFocusedWindow();
	if (focusedWindow !== undefined) {
		// If the focused window is the highest window
		if (
			wm.isMainWindow(focusedWindow) &&
			wm.isTopWindow(wm.getMainWindows(), focusedWindow)
		) {
			// Focus on the bottom stack window
			const bottomStackWindow = wm.getBottomStackWindow();
			if (bottomStackWindow !== undefined) {
				wm.executeYabaiCommand(
					`${yabaiPath} -m window --focus ${bottomStackWindow.id}`
				);
			}
		} else if (
			wm.isStackWindow(focusedWindow) &&
			wm.isTopWindow(wm.getStackWindows(), focusedWindow)
		) {
			// Focus on the bottom main window
			const bottomMainWindow = wm.getBottomMainWindow();
			if (bottomMainWindow !== undefined) {
				wm.executeYabaiCommand(
					`${yabaiPath} -m window --focus ${bottomMainWindow.id}`
				);
			}
		} else {
			// Otherwise, just focus north
			wm.executeYabaiCommand(`${yabaiPath} -m window --focus north`);
		}
	}
}

main().catch(handleMainError);
