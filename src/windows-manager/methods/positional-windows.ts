import invariant from 'tiny-invariant';

import type { Window } from '~/types/yabai.js';
import type { WindowsManager } from '~/windows-manager/class.js';

export function getTopWindow(
	this: WindowsManager,
	windows: Window[]
): Window | undefined {
	if (windows.length === 0) {
		return undefined;
	}

	let topWindow = windows[0];
	invariant(topWindow);
	for (const w of windows) {
		if (w.frame.y < topWindow.frame.y) {
			topWindow = w;
		}
	}

	return topWindow;
}

export function isTopWindow(
	this: WindowsManager,
	windows: Window[],
	window: Window
) {
	return this.getTopWindow(windows)?.id === window.id;
}

export function getBottomWindow(
	this: WindowsManager,
	windows: Window[]
): Window | undefined {
	if (windows.length === 0) {
		return undefined;
	}

	let bottomWindow = windows[0];
	invariant(bottomWindow);
	for (const w of windows) {
		if (w.frame.y > bottomWindow.frame.y) {
			bottomWindow = w;
		}
	}

	return bottomWindow;
}

export function isBottomWindow(
	this: WindowsManager,
	windows: Window[],
	window: Window
) {
	return this.getBottomWindow(windows)?.id === window.id;
}

/**
	The top-left window is the window with the lowest y-coordinate and the lowest x-coordinate.
*/
export function getTopLeftWindow(this: WindowsManager): Window | undefined {
	const leftWindows = this.windowsData.filter((window) =>
		this.isWindowTouchingLeftEdge(window)
	);

	if (leftWindows.length === 0) {
		return undefined;
	}

	let topLeftWindow = leftWindows[0];
	invariant(topLeftWindow);

	for (const window of leftWindows) {
		if (window.frame.y <= topLeftWindow.frame.y) {
			topLeftWindow = window;
		}
	}

	return topLeftWindow;
}

/**
	The top-right window is the rightmost window with the lowest y-coordinate.
*/
export function getTopRightWindow(this: WindowsManager): Window | undefined {
	if (this.windowsData.length === 0) {
		return undefined;
	}

	invariant(this.windowsData[0]);
	let lowestYCoordinate = this.windowsData[0].frame.y;
	for (const window of this.windowsData) {
		if (window.frame.y < lowestYCoordinate) {
			lowestYCoordinate = window.frame.y;
		}
	}

	const topWindows = this.windowsData.filter(
		(window) => window.frame.y === lowestYCoordinate
	);

	let topRightWindow = topWindows[0];
	invariant(topRightWindow);
	for (const window of topWindows) {
		if (window.frame.x > topRightWindow.frame.x) {
			topRightWindow = window;
		}
	}

	return topRightWindow;
}

export function isMiddleWindow(this: WindowsManager, window: Window) {
	return !this.isStackWindow(window) && !this.isMasterWindow(window);
}

export function getMiddleWindows(this: WindowsManager) {
	return this.windowsData.filter((window) => this.isMiddleWindow(window));
}

export function isWindowTouchingLeftEdge(this: WindowsManager, window: Window) {
	return window.frame.x === this.display.frame.x;
}
