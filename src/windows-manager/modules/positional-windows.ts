import type { Window } from '~/types/yabai.js';
import { useDefineMethods } from '~/utils/modules.js';

export function positionalWindowsModule() {
	const defineMethods = useDefineMethods();

	return defineMethods({
		getTopWindow(windows: Window[]) {
			if (windows.length === 0) {
				throw new Error('List of windows provided was empty.');
			}

			let topWindow = windows[0];
			for (const w of windows) {
				if (w.frame.y < topWindow.frame.y) {
					topWindow = w;
				}
			}

			return topWindow;
		},

		isTopWindow(windows: Window[], window: Window) {
			return this.getTopWindow(windows).id === window.id;
		},

		getBottomWindow(windows: Window[]) {
			if (windows.length === 0) {
				throw new Error('List of windows provided was empty.');
			}

			let bottomWindow = windows[0];
			for (const w of windows) {
				if (w.frame.y > bottomWindow.frame.y) {
					bottomWindow = w;
				}
			}

			return bottomWindow;
		},

		isBottomWindow(windows: Window[], window: Window) {
			return this.getBottomWindow(windows).id === window.id;
		},
		/**
			The top-left window is the window with the lowest y-coordinate and the lowest x-coordinate.
		*/
		getTopLeftWindow() {
			const leftWindows = this.windowsData.filter((window) =>
				this.isWindowTouchingLeftEdge(window)
			);
			let topLeftWindow = leftWindows[0];

			for (const window of leftWindows) {
				if (window.frame.y <= topLeftWindow.frame.y) {
					topLeftWindow = window;
				}
			}

			return topLeftWindow;
		},

		/**
			The top-right window is the rightmost window with the lowest y-coordinate.
		*/
		getTopRightWindow(): Window | undefined {
			if (this.windowsData.length === 0) {
				return undefined;
			}

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
			for (const window of topWindows) {
				if (window.frame.x > topRightWindow.frame.x) {
					topRightWindow = window;
				}
			}

			return topRightWindow;
		},

		isMiddleWindow(window: Window) {
			return !this.isStackWindow(window) && !this.isMasterWindow(window);
		},

		getMiddleWindows() {
			return this.windowsData.filter((window) => this.isMiddleWindow(window));
		},

		isWindowTouchingLeftEdge(window: Window) {
			return window.frame.x === this.display.frame.x;
		},
	});
}
