import execa from 'execa';
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

function doWindowsShareYCoordinates(w1: Window, w2: Window) {
	const a = getWindowRect(w1);
	const b = getWindowRect(w2);

	return a.y1 < b.y2 && a.y2 > b.y1;
}

function doWindowsShareXCoordinates(w1: Window, w2: Window) {
	const a = getWindowRect(w1);
	const b = getWindowRect(w2);

	return a.x1 < b.x2 && a.x2 > b.x1;
}

export function isWindowTouchingLeft(window: Window) {
	// Check that the window is the furthest to the left
	for (const w of windowsData) {
		if (w === window) continue;
		// If the windows are side-by-side and w is further left than window
		if (doWindowsShareYCoordinates(w, window) && w.frame.x < window.frame.x) {
			return false;
		}
	}
	return true;
}

export function isWindowTouchingRight(window: Window) {
	for (const w of windowsData) {
		if (w === window) continue;
		// If the windows are side-by-side and w is further right than window
		if (doWindowsShareYCoordinates(w, window) && w.frame.x > window.frame.x) {
			return false;
		}
	}
	return true;
}

/**
 * The widest window touching the right is always guaranteed to be a main window
 */
export function getWidestWindowOnRight() {
	let widestWindow: Window | undefined;
	for (const w of windowsData) {
		if (!isWindowTouchingRight(w)) continue;
		if (widestWindow === undefined || w.frame.w > widestWindow.frame.w) {
			widestWindow = w;
		}
	}

	return widestWindow;
}

/**
 * The widest window touching the left of the screen is always guaranteed to be a stack window
 */
export function getWidestWindowOnLeft() {
	let widestWindow: Window | undefined;
	for (const w of windowsData) {
		if (!isWindowTouchingLeft(w)) continue;
		if (widestWindow === undefined || w.frame.w > widestWindow.frame.w) {
			widestWindow = w;
		}
	}

	return widestWindow;
}

export function moveWindowToStack(windowId: string) {
	let win = getWindowData({ windowId });

	// If the stack exists and the window is already on the stack
	if (windowsData.length > 2 && isWindowTouchingLeft(win)) {
		if (win.split === 'vertical') {
			execa.commandSync(
				`/usr/local/bin/yabai -m window ${win.id} --toggle split`
			);
		}
		return;
	}

	// Find a window that's touching the left side of the screen
	const stackWindow = getWidestWindowOnLeft();

	if (stackWindow === undefined) return;
	execa.commandSync(
		`/usr/local/bin/yabai -m window ${windowId} --warp ${stackWindow.id}`
	);

	win = getWindowData({ windowId });

	if (windowsData.length === 2) {
		if (win.split === 'horizontal') {
			execa.commandSync(
				`/usr/local/bin/yabai -m window ${stackWindow.id} --toggle split`
			);
		}
	} else {
		if (win.split === 'vertical') {
			execa.commandSync(
				`/usr/local/bin/yabai -m window ${stackWindow.id} --toggle split`
			);
		}
	}
}

export function moveWindowToMain(windowId: string) {
	let win = getWindowData({ windowId });

	// Find a window that's touching the right side of the screen
	const mainWindow = getWidestWindowOnRight();

	if (mainWindow === undefined) return;
	execa.commandSync(
		`/usr/local/bin/yabai -m window ${windowId} --warp ${mainWindow.id}`
	);

	win = getWindowData({ windowId });
	if (win.split === 'vertical') {
		execa.commandSync(
			`/usr/local/bin/yabai -m window ${mainWindow.id} --toggle split`
		);
	}
}

export function getMainWindows() {
	return windowsData.filter((w) => isWindowTouchingRight(w));
}

export function getStackWindows() {
	return windowsData.filter((w) => isWindowTouchingLeft(w));
}

export function isMainWindow(window: Window) {
	return isWindowTouchingRight(window);
}

export function isMiddleWindow(window: Window) {
	return !isWindowTouchingRight(window) && !isWindowTouchingLeft(window);
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

		// If there are too many main windows, move them to stack
		if (curNumMainWindows > state.numMainWindows) {
			console.log('Too many main windows.');
			while (curNumMainWindows > state.numMainWindows) {
				const mainWindow = mainWindows.pop()!;
				moveWindowToStack(mainWindow.id.toString());
				curNumMainWindows -= 1;
			}
		}

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

export function isWindowTouchingTop(window: Window) {
	// Check that the window is the furthest to the top
	for (const w of windowsData) {
		if (w === window) continue;
		// If the windows are above-and-below and w is further up than window
		if (doWindowsShareXCoordinates(w, window) && w.frame.y < window.frame.y) {
			return false;
		}
	}
	return true;
}

export function isWindowTouchingBottom(window: Window) {
	// Check that the window is the furthest to the top
	for (const w of windowsData) {
		if (w === window) continue;
		// If the windows are above-and-below and w is further down than window
		if (doWindowsShareXCoordinates(w, window) && w.frame.y > window.frame.y) {
			return false;
		}
	}
	return true;
}

export function getTopStackWindow() {
	return getStackWindows().find((w) => isWindowTouchingTop(w));
}

export function getBottomStackWindow() {
	return getStackWindows().find((w) => isWindowTouchingBottom(w));
}

export function getTopMainWindow() {
	return getMainWindows().find((w) => isWindowTouchingTop(w));
}

export function getBottomMainWindow() {
	return getMainWindows().find((w) => isWindowTouchingBottom(w));
}
