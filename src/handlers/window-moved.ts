import execa from 'execa';
import { readState, windowsData } from '../state';
import { getMainWindows, getWindowData, isMainWindow, isWindowTouchingLeft, isWindowTouchingRight, moveWindowToMain, moveWindowToStack } from '../utils';
import lockfile from 'proper-lockfile';

const numWindows = windowsData.length

/*
lockfile.lockSync('window-moved-handler.lock');

if (numWindows > 2) {
	const mainWindows = getMainWindows();
	let curNumMainWindows = mainWindows.length;
	const state = readState();

	// If there are too many main windows, move them to stack
	if (curNumMainWindows > state.numMainWindows) {
		console.log('Too many main windows.')
		while (curNumMainWindows > state.numMainWindows) {
			const mainWindow = mainWindows.pop()!;
			moveWindowToStack(mainWindow.id.toString());
			curNumMainWindows -= 1;
		}
		curNumMainWindows -= 1;
	}

	// If there are windows that aren't touching either the left side or the right side 
	// after the move, fill up main and then move the rest to stack
	for (const window of windowsData) {
		if (!isWindowTouchingRight(window) && !isWindowTouchingLeft(window)) {
			console.log('Middle window detected.');
			if (curNumMainWindows < state.numMainWindows) {
				console.log('Moving middle window to main.');
				moveWindowToMain(window.id.toString())
				curNumMainWindows += 1;
			} else {
				console.log('Moving middle window to stack.');
				moveWindowToStack(window.id.toString());
			}
		}
	}
}

lockfile.unlockSync('window-moved-handler.lock');
*/