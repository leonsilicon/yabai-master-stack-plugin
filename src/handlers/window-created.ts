import { readState } from '../state';
import { getMainWindows, getWindowData, moveWindowToMain, moveWindowToStack } from '../utils';

const processId = process.env.YABAI_PROCESS_ID as string;
const windowId = process.env.YABAI_WINDOW_ID as string;
const state = readState();
const curNumMainWindows = getMainWindows().length;
const window = getWindowData({ windowId, processId });

// If the main can fit more windows
if (curNumMainWindows > 1 && curNumMainWindows <= state.numMainWindows) {
	// move the window to the main
	console.log('Moving newly created window to main.');
	moveWindowToMain(window.id.toString());
} 
// if there are too many windows on the main
else {
	console.log('Moving newly created window to stack.');
	// move the window to the stack
	moveWindowToStack(window.id.toString());
}