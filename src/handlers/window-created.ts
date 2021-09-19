import execa from 'execa';
import { getWindowData, getWindowsData } from '../utils';

const mainWindowWidth = 1080;
const processId = process.env.YABAI_PROCESS_ID as string;
const windowId = process.env.YABAI_WINDOW_ID as string;

const windowsData = getWindowsData();
const numWindows = windowsData.length

// Resize the main window to the width
if (numWindows === 2) {
	// Make sure the split is horizontal
	const window = getWindowData({ processId, windowId });
	if (window.split === 'horizontal') {
		execa.commandSync(`yabai -m window ${window.id} --toggle split`)
	}
} 
// Reposition all the secondary windows
else if (numWindows > 2) {
	// Make sure the split is vertical
	const window = getWindowData({ processId, windowId });
	console.log(window)
	if (window.split === 'vertical') {
		execa.commandSync(`yabai -m window ${window.id} --toggle split`)
	}

	// Insert the most recently created window
}
