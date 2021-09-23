import execa from 'execa';
import { yabaiPath } from '../config';
import { readState } from '../state';
import type { Display, Window } from '../types';

function getDistanceBetweenPoints(
	p1: readonly [number, number],
	p2: readonly [number, number]
) {
	return Math.sqrt(
		(p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1])
	);
}

export function createWindowsManager({ display }: { display: Display }) {
	const windowsData = (
		JSON.parse(
			execa.commandSync(`${yabaiPath} -m query --windows`).stdout
		) as Window[]
	).filter((win) => win.split !== 'none');

	type GetWindowDataProps = { processId?: string; windowId?: string };
	const windowsManager = {
		windowsData,
		getDisplayDimensions() {},
		getWindowData({ processId, windowId }: GetWindowDataProps): Window {
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
		},
		getFocusedWindow(): Window | undefined {
			return windowsData.find((w) => w.focused === 1);
		},
		getFnWindowId() {
			return process.argv[2] ?? this.getFocusedWindow();
		},
		/**
		 * There is always a line dividing the main windows from the secondary windows. To find this line,
		 * we use two main observations:
		 * 1. The top-right window is always on the right side of the dividing line.
		 * 2. The bottom-right window is always on the right side of the dividing line.
		 * Using these observations, we use the heuristic that the dividing line is created by the first pair
		 * of windows which both start at an x-coordinate that is equal or less than both the top-right and
		 * bottom-right windows.
		 */
		getDividingLineXCoordinate() {
			const topRightWindow = this.getTopRightWindow();

			// If there are two windows or less, the dividing line is the x-value of the top-right window
			if (windowsData.length <= 2) return topRightWindow.frame.x;

			const bottomRightWindow = this.getBottomRightWindow();

			// If the top-right window is equal to the bottom-right window, it means there
			// is only one main window (which is the top-right and bottom-left window).
			if (topRightWindow === bottomRightWindow) {
				return topRightWindow.frame.x;
			}

			const maximumDividingLineXCoordinate = Math.min(
				topRightWindow.frame.x,
				bottomRightWindow.frame.x
			);

			// Sorting eligible windows from right to left
			const eligibleWindows = windowsData
				.filter((window) => window.frame.x <= maximumDividingLineXCoordinate)
				.sort((window1, window2) => window2.frame.x - window1.frame.x);

			for (let i = 0; i < eligibleWindows.length - 1; i += 1) {
				const curWindow = eligibleWindows[i];
				const nextWindow = eligibleWindows[i + 1];
				if (curWindow.frame.x === nextWindow.frame.x) {
					return curWindow.frame.x;
				}
			}

			throw new Error("Could not find the dividing line's x-coordinate.");
		},
		/**
		 * The top-right window is the window whose top-right corner is the minimum distance from
		 * the top-right corner of the display.
		 */
		getTopRightWindow() {
			let topRightWindow = windowsData[0];
			let minDistance = Infinity;
			const displayTopRightCorner = [
				display.frame.x + display.frame.w,
				display.frame.y,
			] as const;
			for (const window of windowsData) {
				const windowTopRightCorner = [
					window.frame.x + window.frame.w,
					window.frame.y,
				] as const;
				const distance = getDistanceBetweenPoints(
					displayTopRightCorner,
					windowTopRightCorner
				);
				if (distance < minDistance) {
					minDistance = distance;
					topRightWindow = window;
				}
			}
			return topRightWindow;
		},
		/**
		 * The bottom-right window is the window whose bottom-right corner is the minimum distance
		 * from the bottom-right corner of the display.
		 */
		getBottomRightWindow() {
			let bottomRightWindow = windowsData[0];
			let minDistance = Infinity;
			const displayBottomRightCorner = [
				display.frame.x + display.frame.w,
				display.frame.y + display.frame.h,
			] as const;
			for (const window of windowsData) {
				const windowBottomRightCorner = [
					window.frame.x + window.frame.w,
					window.frame.y + window.frame.h,
				] as const;
				const distance = getDistanceBetweenPoints(
					displayBottomRightCorner,
					windowBottomRightCorner
				);
				if (distance < minDistance) {
					minDistance = distance;
					bottomRightWindow = window;
				}
			}
			return bottomRightWindow;
		},
		getWidestStackWindow() {
			let widestStackWindow: Window | undefined;
			for (const window of this.getStackWindows()) {
				if (
					widestStackWindow === undefined ||
					window.frame.w > widestStackWindow.frame.w
				) {
					widestStackWindow = window;
				}
			}
			return widestStackWindow;
		},
		getWidestMainWindow() {
			let widestMainWindow: Window | undefined;
			for (const window of this.getMainWindows()) {
				if (
					widestMainWindow === undefined ||
					window.frame.w > widestMainWindow.frame.w
				) {
					widestMainWindow = window;
				}
			}
			return widestMainWindow;
		},
		moveWindowToStack(windowId: string) {
			let win = this.getWindowData({ windowId });

			// If the stack exists and the window is already on the stack
			if (windowsData.length > 2 && this.isStackWindow(win)) {
				if (win.split === 'vertical') {
					execa.commandSync(`${yabaiPath} -m window ${win.id} --toggle split`);
				}
				return;
			}

			// Find a window that's touching the left side of the screen
			const stackWindow = this.getWidestStackWindow();
			if (stackWindow === undefined) return;

			execa.commandSync(
				`${yabaiPath} -m window ${windowId} --warp ${stackWindow.id}`
			);

			win = this.getWindowData({ windowId });

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
		},
		moveWindowToMain(windowId: string) {
			let win = this.getWindowData({ windowId });

			// Find a window that's touching the right side of the screen
			const mainWindow = this.getWidestMainWindow();

			if (mainWindow === undefined) return;
			execa.commandSync(
				`${yabaiPath} -m window ${windowId} --warp ${mainWindow.id}`
			);

			win = this.getWindowData({ windowId });
			if (win.split === 'vertical') {
				execa.commandSync(
					`${yabaiPath} -m window ${mainWindow.id} --toggle split`
				);
			}
		},
		isMainWindow(window: Window) {
			/**
			 * A window which is to the right of the dividing line is considered a main window.
			 */
			const dividingLineXCoordinate = this.getDividingLineXCoordinate();
			return window.frame.x >= dividingLineXCoordinate;
		},
		isStackWindow(window: Window) {
			return window.frame.x === 0;
		},
		isMiddleWindow(window: Window) {
			return !this.isStackWindow(window) && !this.isMainWindow(window);
		},
		getMainWindows() {
			const dividingLineXCoordinate = this.getDividingLineXCoordinate();
			return windowsData.filter(
				(window) => window.frame.x >= dividingLineXCoordinate
			);
		},
		/**
		 * If the window's frame has an x of 0, it is a stack window
		 */
		getStackWindows() {
			return windowsData.filter((w) => this.isStackWindow(w));
		},
		isValidLayout(): { status: true } | { status: false; reason: string } {
			const state = readState();
			const curNumMainWindows = this.getMainWindows().length;
			if (state.numMainWindows !== curNumMainWindows) {
				return {
					status: false,
					reason: `Number of main windows does not equal expected number of main windows (${curNumMainWindows}/${state.numMainWindows})`,
				};
			}

			for (const window of windowsData) {
				if (this.isMiddleWindow(window)) {
					return {
						status: false,
						reason: `A middle window (${window}) was detected.`,
					};
				}
			}

			return { status: true };
		},
		updateWindows() {
			if (this.isValidLayout().status === true) {
				console.log('Valid layout detected; no changes were made.');
				return;
			}

			const numWindows = windowsData.length;

			if (numWindows > 2) {
				const mainWindows = this.getMainWindows();
				let curNumMainWindows = mainWindows.length;
				console.log('num', curNumMainWindows);
				const state = readState();

				// If there are too many main windows, move them to stack
				if (curNumMainWindows > state.numMainWindows) {
					console.log(
						`Too many main windows (${curNumMainWindows}/${state.numMainWindows}).`
					);
					// Sort the windows by reverse y-coordinate and x-coordinate so we remove the bottom-left main windows first
					mainWindows.sort((window1, window2) =>
						window1.frame.y !== window2.frame.y
							? window2.frame.y - window1.frame.y
							: window1.frame.x - window2.frame.x
					);
					while (curNumMainWindows > state.numMainWindows) {
						const mainWindow = mainWindows.pop()!;
						console.log(`Moving main window ${mainWindow.app} to stack.`);
						this.moveWindowToStack(mainWindow.id.toString());
						curNumMainWindows -= 1;
					}
				}

				// If there are windows that aren't touching either the left side or the right side
				// after the move, fill up main and then move the rest to stack
				for (const window of windowsData) {
					if (this.isMiddleWindow(window)) {
						console.log(`Middle window ${window.app} detected.`);
						if (curNumMainWindows < state.numMainWindows) {
							console.log(`Moving middle window ${window.app} to main.`);
							this.moveWindowToMain(window.id.toString());
							curNumMainWindows += 1;
						} else {
							console.log(`Moving middle window ${window.app} to stack.`);
							this.moveWindowToStack(window.id.toString());
						}
					}
				}

				// If there are still not enough main windows, move some of the stack windows to main
				const stackWindows = this.getStackWindows();
				// Sort the stack windows by reverse y-coordinate and reverse x-coordinate to move the
				// bottom-rightmost windows first
				stackWindows.sort((window1, window2) =>
					window1.frame.x !== window2.frame.x
						? window2.frame.x - window1.frame.x
						: window2.frame.y - window1.frame.y
				);
				while (curNumMainWindows < state.numMainWindows) {
					const stackWindow = stackWindows.pop()!;
					console.log(`Moving stack window ${stackWindow.app} to main.`);
					this.moveWindowToMain(stackWindow.id.toString());
					curNumMainWindows += 1;
				}
			}

			// Note: the following should never be called
			const layoutValidity = this.isValidLayout();
			if (layoutValidity.status === false) {
				throw new Error(
					`updateLayout() ended with an invalid layout; reason: ${layoutValidity.reason}`
				);
			}
		},
		getTopWindow(windows: Window[]) {
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
		getTopStackWindow() {
			return this.getTopWindow(this.getStackWindows());
		},
		getBottomStackWindow() {
			return this.getBottomWindow(this.getStackWindows());
		},
		getTopMainWindow() {
			return this.getTopWindow(this.getMainWindows());
		},
		getBottomMainWindow() {
			return this.getBottomWindow(this.getMainWindows());
		},
	};

	return windowsManager;
}
