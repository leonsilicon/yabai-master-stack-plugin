import execa from 'execa';
import { yabaiPath } from '../config';
import {
	getBottomMainWindow,
	getBottomStackWindow,
	getFocusedWindow,
	isMainWindow,
	isWindowTouchingTop,
} from '../utils';

const focusedWindow = getFocusedWindow();
if (focusedWindow !== undefined) {
	// If the focused window is the highest window
	if (isWindowTouchingTop(focusedWindow)) {
		if (isMainWindow(focusedWindow)) {
			// Focus on the bottom stack window
			const bottomStackWindow = getBottomStackWindow();
			if (bottomStackWindow !== undefined) {
				execa.commandSync(`${yabaiPath} -m window --focus ${bottomStackWindow.id}`);
			}
		} else {
			// Focus on the bottom main window
			const bottomMainWindow = getBottomMainWindow();
			if (bottomMainWindow !== undefined) {
				execa.commandSync(`${yabaiPath} -m window --focus ${bottomMainWindow.id}`);
			}
		}
	} else {
		// Otherwise, just focus north
		execa.commandSync(`${yabaiPath} -m window --focus north`);
	}
}
