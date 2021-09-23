import execa from 'execa';
import { yabaiPath } from '../config';
import { readState } from '../state';
import { createWindowsManager } from '../utils';

const { numMainWindows } = readState();
const wm = createWindowsManager({ numMainWindows });
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
			execa.commandSync(
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
			execa.commandSync(
				`${yabaiPath} -m window --focus ${bottomMainWindow.id}`
			);
		}
	} else {
		// Otherwise, just focus north
		execa.commandSync(`${yabaiPath} -m window --focus north`);
	}
}
