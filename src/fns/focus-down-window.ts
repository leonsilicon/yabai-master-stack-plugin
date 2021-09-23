import execa from 'execa';
import { yabaiPath } from '../config';
import { createWindowsManager } from '../utils';

const wm = createWindowsManager();
const focusedWindow = wm.getFocusedWindow();
if (focusedWindow !== undefined) {
	// If the focused window is the lowest main window
	if (
		wm.isMainWindow(focusedWindow) &&
		wm.isBottomWindow(wm.getMainWindows(), focusedWindow)
	) {
		// Focus on the top stack window
		const topStackWindow = wm.getTopStackWindow();
		if (topStackWindow !== undefined) {
			execa.commandSync(`${yabaiPath} -m window --focus ${topStackWindow.id}`);
		}
	} else if (
		wm.isStackWindow(focusedWindow) &&
		wm.isBottomWindow(wm.getStackWindows(), focusedWindow)
	) {
		// Focus on the top main window
		const topMainWindow = wm.getTopMainWindow();
		if (topMainWindow !== undefined) {
			execa.commandSync(`${yabaiPath} -m window --focus ${topMainWindow.id}`);
		}
	}
	// Otherwise, just focus south
	else {
		execa.commandSync(`${yabaiPath} -m window --focus south`);
	}
}
