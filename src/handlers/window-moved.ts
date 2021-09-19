import execa from 'execa';
import { windowsData } from '../state';
import { getWindowData, isMainWindow } from '../utils';

const processId = process.env.YABAI_PROCESS_ID as string;
const windowId = process.env.YABAI_WINDOW_ID as string;
const numWindows = windowsData.length

// Reposition all the secondary windows
if (numWindows > 2) {
	// Make sure the split is vertical
	let window = getWindowData({ processId, windowId });

	// Only check the split orientation if the window is not a main window
	if (isMainWindow(window)) {
		if (window.split === 'horizontal') {
			execa.commandSync(`yabai -m window ${window.id} --toggle split`)
		}
	} else {
		if (window.split === 'vertical') {
			execa.commandSync(`yabai -m window ${window.id} --toggle split`)
		}
	}
}
