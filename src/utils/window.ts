import execa from 'execa';
import { yabaiPath } from '../config';
import { readState, refreshWindowsData, windowsData } from '../state';
import type { Window } from '../types';

export function getWindowData({
	processId,
	windowId,
}: {
	processId?: string;
	windowId?: string;
}): Window {
	refreshWindowsData();
	if (processId === undefined && windowId === undefined) {
		throw new Error('Must provide at least one of processId or windowId');
	}

	let windowData: Window | undefined;
	windowData = windowsData.find(
		(window) =>
			window.pid === Number(processId) || window.id === Number(windowId)
	);

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

type WindowRect = {
	x1: number;
	x2: number;
	y1: number;
	y2: number;
};

function getWindowRect(w: Window): WindowRect {
	return {
		x1: w.frame.x,
		x2: w.frame.x + w.frame.w,
		y1: w.frame.y,
		y2: w.frame.y + w.frame.h,
	};
}

export function getLeftmostWindow(windows: Window[]) {
	let leftmostWindow = windows[0];
	for (const w of windows) {
		// If the windows are side-by-side and w is further left than window
		if (w.frame.x < leftmostWindow.frame.x) {
			leftmostWindow = w;
		}
	}
	return leftmostWindow;
}

export function getRightmostWindow(windows: Window[]) {
	let rightmostWindow = windows[0];
	for (const w of windows) {
		if (w.frame.x > rightmostWindow.frame.x) {
			rightmostWindow = w;
		}
	}
	return rightmostWindow;
}

const isWindowTouchingLeft = (window: Window) => window.frame.x <= 0;

export const getLeftmostStackWindow = () => getLeftmostWindow(windowsData);
export const getRightmostMainWindow = () => getRightmostWindow(windowsData);

export function moveWindowToStack(windowId: string) {
	let win = getWindowData({ windowId });

	// If the stack exists and the window is already on the stack
	if (windowsData.length > 2 && isWindowTouchingLeft(win)) {
		if (win.split === 'vertical') {
			execa.commandSync(`${yabaiPath} -m window ${win.id} --toggle split`);
		}
		return;
	}

	// Find a window that's touching the left side of the screen
	const stackWindow = getLeftmostStackWindow();

	if (stackWindow === undefined) return;
	execa.commandSync(
		`${yabaiPath} -m window ${windowId} --warp ${stackWindow.id}`
	);

	win = getWindowData({ windowId });

	if (windowsData.length === 2) {
		if (win.split === 'horizontal') {
			execa.commandSync(
				`${yabaiPath} -m window ${stackWindow.id} --toggle split`
			);
		}
	} else {
		if (win.split === 'vertical') {
			execa.commandSync(
				`${yabaiPath} -m window ${stackWindow.id} --toggle split`
			);
		}
	}
}

export function moveWindowToMain(windowId: string) {
	let win = getWindowData({ windowId });

	// Find a window that's touching the right side of the screen
	const mainWindow = getRightmostMainWindow();

	if (mainWindow === undefined) return;
	execa.commandSync(
		`${yabaiPath} -m window ${windowId} --warp ${mainWindow.id}`
	);

	win = getWindowData({ windowId });
	if (win.split === 'vertical') {
		execa.commandSync(`${yabaiPath} -m window ${mainWindow.id} --toggle split`);
	}
}

/**
 * If the window's frame has an x of 0, it is a stack window
 */
export function getStackWindows() {
	return windowsData.filter((w) => w.frame.x === 0);
}

/**
 * If the window's frame has an x equal to the rightmost window, it is a main window
 */
export function getMainWindows() {
	const rightmostWindow = getRightmostWindow(windowsData);
	return windowsData.filter((w) => w.frame.x === rightmostWindow.frame.x);
}

export const isMainWindow = (window: Window) => getMainWindows().includes(window);
export const isStackWindow = (window: Window) => window.frame.x === 0;

export function isMiddleWindow(window: Window) {
	return !getStackWindows().includes(window) && !getMainWindows().includes(window);
}

export function isValidLayout() {
	const state = readState();
	const curNumMainWindows = getMainWindows().length;
	if (state.numMainWindows !== curNumMainWindows) return false;

	for (const w of windowsData) {
		if (isMiddleWindow(w)) return false;
	}

	return true;
}

export function updateWindows() {
	if (isValidLayout()) {
		console.log('Valid layout detected; no changes were made.');
		return;
	}

	const numWindows = windowsData.length;

	if (numWindows > 2) {
		const mainWindows = getMainWindows();
		let curNumMainWindows = mainWindows.length;
		const state = readState();

		// If there are windows that aren't touching either the left side or the right side
		// after the move, fill up main and then move the rest to stack
		for (const window of windowsData) {
			if (isMiddleWindow(window)) {
				console.log('Middle window detected.');
				if (curNumMainWindows < state.numMainWindows) {
					console.log('Moving middle window to main.');
					moveWindowToMain(window.id.toString());
					curNumMainWindows += 1;
				} else {
					console.log('Moving middle window to stack.');
					moveWindowToStack(window.id.toString());
				}
			}
		}

		// If there are too many main windows, move them to stack
		if (curNumMainWindows > state.numMainWindows) {
			console.log('Too many main windows.');
			while (curNumMainWindows > state.numMainWindows) {
				const mainWindow = mainWindows.pop()!;
				moveWindowToStack(mainWindow.id.toString());
				curNumMainWindows -= 1;
			}
		}


		const stackWindows = getStackWindows();
		while (curNumMainWindows < state.numMainWindows) {
			const stackWindow = stackWindows.pop()!;
			moveWindowToMain(stackWindow.id.toString());
			curNumMainWindows += 1;
		}
	}

	if (!isValidLayout()) {
		throw new Error('Update layout ended with an invalid layout.');
	}
}

export function getTopWindow(windows: Window[]) {
	let topWindow = windows[0];
	for (const w of windows) {
		if (w.frame.y < topWindow.frame.y) {
			topWindow = w;
		}
	}
	return topWindow;
}
export const isTopWindow = (windows: Window[], window: Window) => getTopWindow(windows).id === window.id;

export function getBottomWindow(windows: Window[]) {
	let bottomWindow = windows[0];
	for (const w of windows) {
		if (w.frame.y > bottomWindow.frame.y) {
			bottomWindow = w;
		}
	}
	return bottomWindow;
}
export const isBottomWindow = (windows: Window[], window: Window) => getBottomWindow(windows).id === window.id;

export const getTopStackWindow = () => getTopWindow(getStackWindows());
export const getBottomStackWindow = () => getBottomWindow(getStackWindows());
export const getTopMainWindow = () => getTopWindow(getMainWindows());
export const getBottomMainWindow = () => getBottomWindow(getMainWindows());