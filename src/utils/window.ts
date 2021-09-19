import { getScreenSize } from '.';
import { readState, windowsData } from '../state';
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
	const state = readState();
	return state.mainWindowIds.includes(window.id.toString());
}

export function getFocusedWindow(): Window | undefined {
	return windowsData.find((w) => w.focused === 1);
}