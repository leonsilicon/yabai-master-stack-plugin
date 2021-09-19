import { getScreenSize } from '.';
import { windowsData, refreshWindowsData } from '../state';
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

export function getMainWindow(): Window | undefined {
	const screenSize = getScreenSize();
	// Find the window on the right of the screen
	const mainWindow = windowsData.find(({ frame }) => {
		return frame.x + frame.w === screenSize.width;
	});

	return mainWindow;
}
