import execa from 'execa';
import { getScreenSize } from '.';
import type { Window } from '../types';

export type WindowData = Window[] | undefined;
let cachedWindowsData;
export function getWindowsData(): Window[] {
	const windowsData = JSON.parse(execa.commandSync('yabai -m query --windows').stdout) as Window[];
	return (cachedWindowsData = windowsData);
}

export function getWindowData({ processId, windowId }: {processId?: string, windowId?: string}): Window {
	if (processId === undefined && windowId === undefined) {
		throw new Error('Must provide at least one of processId or windowId');
	}

	let windowData: Window | undefined;
	if (processId !== undefined) {
		windowData = getWindowsData().find((window) => window.pid === Number(processId));
	} else {
		windowData = getWindowsData().find((window) => window.id === Number(windowId));
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

export function getMainWindow() {
	const windowsData = getWindowsData();
	const screenSize = getScreenSize();
	// Find the window on the right of the screen
	const mainWindow = windowsData.find(({ frame }) => {
		return frame.x + frame.w === screenSize.width;
	});

	if (mainWindow === undefined) {
		throw new Error('Could not locate main window.')
	}

	return mainWindow;
}