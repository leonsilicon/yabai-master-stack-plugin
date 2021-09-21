import execa from 'execa';
import { yabaiPath } from '../config';
import {
	getFocusedWindow,
	getMainWindows,
	getStackWindows,
	getTopMainWindow,
	getTopStackWindow,
	isBottomWindow,
	isMainWindow,
	isStackWindow,
} from '../utils';

const focusedWindow = getFocusedWindow();
if (focusedWindow !== undefined) {
	// If the focused window is the lowest main window
	if (
		isMainWindow(focusedWindow) &&
		isBottomWindow(getMainWindows(), focusedWindow)
	) {
		// Focus on the top stack window
		const topStackWindow = getTopStackWindow();
		if (topStackWindow !== undefined) {
			execa.commandSync(`${yabaiPath} -m window --focus ${topStackWindow.id}`);
		}
	} else if (
		isStackWindow(focusedWindow) &&
		isBottomWindow(getStackWindows(), focusedWindow)
	) {
		// Focus on the top main window
		const topMainWindow = getTopMainWindow();
		if (topMainWindow !== undefined) {
			execa.commandSync(`${yabaiPath} -m window --focus ${topMainWindow.id}`);
		}
	}
	// Otherwise, just focus south
	else {
		execa.commandSync(`${yabaiPath} -m window --focus south`);
	}
}
