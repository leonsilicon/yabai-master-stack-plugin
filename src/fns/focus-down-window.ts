import execa from 'execa';
import { yabaiPath } from '../config';
import {
	getFocusedWindow,
	getTopMainWindow,
	getTopStackWindow,
	isMainWindow,
	isWindowTouchingBottom,
} from '../utils';

const focusedWindow = getFocusedWindow();
if (focusedWindow !== undefined) {
	// If the focused window is the lowest window
	if (isWindowTouchingBottom(focusedWindow)) {
		if (isMainWindow(focusedWindow)) {
			// Focus on the top stack window
			const topStackWindow = getTopStackWindow();
			if (topStackWindow !== undefined) {
				execa.commandSync(`${yabaiPath} -m window --focus ${topStackWindow.id}`);
			}
		} else {
			// Focus on the top main window
			const topMainWindow = getTopMainWindow();
			if (topMainWindow !== undefined) {
				execa.commandSync(`${yabaiPath} -m window --focus ${topMainWindow.id}`);
			}
		}
	}
	// Otherwise, just focus south
	else {
		execa.commandSync(`${yabaiPath} -m window --focus south`);
	}
}
