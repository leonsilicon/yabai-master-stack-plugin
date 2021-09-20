import execa from 'execa';
import { refreshWindowsData, windowsData } from '../state';
import type { Window } from '../types';

export function getWindowData({ processId, windowId }: {processId?: string, windowId?: string}): Window {
	refreshWindowsData();
	if (processId === undefined && windowId === undefined) {
		throw new Error('Must provide at least one of processId or windowId');
	}

	let windowData: Window | undefined;
	windowData = windowsData.find((window) => window.pid === Number(processId) || window.id === Number(windowId));

	if (windowData === undefined) {
		if (processId !== undefined) {
			throw new Error(`Window with pid ${processId} not found.`);
		} else {
			throw new Error(`Window with id ${windowId} not found.`);
		}
	}

	return windowData;
}

export function getFocusedWindow(): Window | undefined {
	return windowsData.find((w) => w.focused === 1);
}

export function getFnWindowId() {
	return process.argv[2] ?? getFocusedWindow();
}

function doWindowsShareYCoordinates(w1: Window, w2: Window) {
	const a = { x1: w1.frame.x, x2: w1.frame.x, y1: w1.frame.y, y2: w1.frame.y + w1.frame.h };
	const b = { x1: w2.frame.x, x2: w2.frame.x + w2.frame.w, y1: w2.frame.y, y2: w2.frame.y + w2.frame.h };

	return a.y1 < b.y2 && a.y2 > b.y1;
}

export function isWindowTouchingRight(window: Window) {
	for (const w of windowsData) {
		// If the windows are side-by-side and w is further right than window
		if (doWindowsShareYCoordinates(w, window) && w.frame.x + w.frame.w > window.frame.x + window.frame.w)  {
			return false;
		}
	}
	return true;
}

export function isWindowTouchingLeft(window: Window) {
	for (const w of windowsData) {
		// If the windows are side-by-side and w is further left than window
		if (doWindowsShareYCoordinates(w, window) && w.frame.x + w.frame.w < window.frame.x + window.frame.w)  {
			return false;
		}
	}
	return true;
}

export function moveWindowToStack(windowId: string) {
	let win = getWindowData({ windowId })

	// Find a window that's touching the left side of the screen
	const leftSideWindow = windowsData.find((w) => w.id.toString() !== windowId && isWindowTouchingLeft(w))!;

	execa.commandSync(`yabai -m window ${windowId} --warp ${leftSideWindow.id}`);

	win = getWindowData({ windowId })

	if (windowsData.length === 2) {
		if (win.split === 'horizontal') {
			execa.commandSync(`yabai -m window ${leftSideWindow.id} --toggle split`);
		}
	} else {
		if (win.split === 'vertical') {
			execa.commandSync(`yabai -m window ${leftSideWindow.id} --toggle split`);
		}
	}
}

export function moveWindowToMain(windowId: string) {
	let win = getWindowData({ windowId })

	// Find a window that's touching the right side of the screen
	const rightSideWindow = windowsData.find((w) => w.id.toString() !== windowId && isWindowTouchingRight(w))!;

	win = getWindowData({ windowId })
	if (win.split === 'vertical') {
		execa.commandSync(`yabai -m window ${rightSideWindow.id} --toggle split`);
	}
}

export function getMainWindows() {
	return windowsData.filter((w) => isWindowTouchingRight(w));
}

export function isMainWindow(window: Window) {
	return isWindowTouchingRight(window);
}