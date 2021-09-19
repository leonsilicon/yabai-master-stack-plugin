import execa from 'execa';
import { refreshWindowsData, windowsData } from '../state';
import { getWindowData } from '../utils';

const processId = process.env.YABAI_PROCESS_ID as string;
const windowId = process.env.YABAI_WINDOW_ID as string;
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
	let window = getWindowData({ processId, windowId });

	try {
		execa.commandSync(`yabai -m window ${window.id} --warp first`);
	} catch(e) {}

	refreshWindowsData();
	window = getWindowData({ processId, windowId });

	if (window.split === 'vertical') {
		execa.commandSync(`yabai -m window ${window.id} --toggle split`)
	}
}
