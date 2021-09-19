import { getScreenSize } from '.';
import { windowsData } from '../state';
import type { Window } from '../types';

export function getWindowData({ processId, windowId }: {processId?: string, windowId?: string}): Window {
	if (processId === undefined && windowId === undefined) {
		throw new Error('Must provide at least one of processId or windowId');
	}

	let windowData: Window | undefined;
	if (processId !== undefined) {
		windowData = windowsData.find((window) => window.pid === Number(processId));
	} else {
		windowData = windowsData.find((window) => window.id === Number(windowId));
	}

	if (windowData === undefined) {
		if (processId !== undefined) {
			throw new Error(`Window with pid ${processId} not found.`);
		} else {
			throw new Error(`Window with id ${windowId} not found.`);
		}
	}

	return windowData;
}

export function getRightmostWindows(): Window[] {
	const screenSize = getScreenSize();
	// Get all windows that's touching the right side of the screen
	const rightmostWindows = windowsData.filter(({ frame }) => {
		return frame.x + frame.w === screenSize.width;
	})!;

	return rightmostWindows;
}

export function isMainWindow(window: Window) {
	let leftX = Number.MAX_SAFE_INTEGER;
	for (const rightmostWin of getRightmostWindows()) {
		if (rightmostWin.frame.x < leftX) {
			leftX = rightmostWin.frame.x;
		}
	}

	// Only a main window if it's x value is greater or equal than leftX 
	return window.frame.x >= leftX;
}