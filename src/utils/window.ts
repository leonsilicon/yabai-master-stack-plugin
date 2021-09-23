import execa from 'execa';

import { yabaiPath } from '../config';
import { readState } from '../state';
import type { Display, Window } from '../types';

export function createWindowsManager({
	display: _,
	numMainWindows: expectedNumMainWindows,
}: {
	display: Display;
	numMainWindows: number;
}) {
	type GetWindowDataProps = { processId?: string; windowId?: string };

	function getWindowsData() {
		const windowsData = (
			JSON.parse(
				execa.commandSync(`${yabaiPath} -m query --windows`).stdout
			) as Window[]
		).filter((win) => win.split !== 'none');
		return windowsData;
	}

	const windowsManager = {
		expectedNumMainWindows,
		windowsData: getWindowsData(),
		refreshWindowsData() {
			this.windowsData = getWindowsData();
		},
		executeYabaiCommand(command: string) {
			const result = execa.commandSync(command);
			this.refreshWindowsData();
			return result;
		},
		getWindowData({ processId, windowId }: GetWindowDataProps): Window {
			if (processId === undefined && windowId === undefined) {
				throw new Error('Must provide at least one of processId or windowId');
			}

			const windowData = this.windowsData.find(
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
			return this.windowsData.find((w) => w.focused === 1);
		},
		getFnWindowId() {
			return process.argv[2] ?? this.getFocusedWindow();
		},
		/**
		 * There is always a line dividing the main windows from the secondary windows. To find this line,
		 * we use two main observations:
		 * 1. The top-right window is always on the right side of the dividing line.
		 * 2. If there is more than one main window, the dividing line must cross the left side of two
		 * windows
		 * Using these observations, we can loop through the windows in descending x-coordinate starting from the top-right window
		 * and for each pair of windows that share x-coordinates, we check if the numMainWindows is less
		 * than the number of windows we've iterated through, and if so, return the x-coordinate of the currently
		 * processed window
		 */
		getDividingLineXCoordinate() {
			const topRightWindow = this.getTopRightWindow();
			console.log(`Top-right window: ${topRightWindow.app}`);

			if (this.expectedNumMainWindows === 1) return topRightWindow.frame.x;

			// Get all the windows to the left of the top-right window
			const eligibleWindows = this.windowsData
				.filter((window) => window.frame.x <= topRightWindow.frame.x)
				.sort((window1, window2) => window2.frame.x - window1.frame.x);

			const numWindowsToRightOfTopRightWindow =
				this.windowsData.length - eligibleWindows.length;

			// If there are enough windows that are to the right of the top-right window, then return
			// the top-right window's x-coordinate
			if (numWindowsToRightOfTopRightWindow >= this.expectedNumMainWindows) {
				return topRightWindow.frame.x;
			}

			// Otherwise, iterate through the eligible windows in order and find pairs of windows
			for (let i = 0; i < eligibleWindows.length - 1; i += 1) {
				const curWindow = eligibleWindows[i];
				const nextWindow = eligibleWindows[i + 1];
				if (
					curWindow.frame.x === nextWindow.frame.x &&
					numWindowsToRightOfTopRightWindow + i + 2 >=
						this.expectedNumMainWindows
				) {
					return curWindow.frame.x;
				}
			}

			// If a pair of windows could not be found (which means all the windows are side-by-side), just
			// return the top-right window's x-coordinate
			return topRightWindow.frame.x;
		},
		/**
		 * The top-left window is the window with the lowest y-coordinate and the lowest x-coordinate.
		 */
		getTopLeftWindow() {
			let topLeftWindow = this.windowsData[0];
			for (const window of this.windowsData) {
				if (
					window.frame.y <= topLeftWindow.frame.y &&
					window.frame.x < topLeftWindow.frame.x
				) {
					topLeftWindow = window;
				}
			}
			return topLeftWindow;
		},
		/*
		 * The top-right window is the rightmost window with the lowest x-coordinate.
		 */
		getTopRightWindow() {
			let topRightWindow = this.windowsData[0];
			for (const window of this.windowsData) {
				if (
					window.frame.y <= topRightWindow.frame.y &&
					window.frame.x > topRightWindow.frame.x
				) {
					topRightWindow = window;
				}
			}
			return topRightWindow;
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
		// In the event that the windows get badly rearranged and all the windows span the entire width of
		// the screen, split the top-right window vertically and then move the windows into the split
		createStack() {
			const topRightWindow = this.getTopRightWindow();
			if (topRightWindow.split === 'horizontal') {
				this.executeYabaiCommand(
					`${yabaiPath} -m window ${topRightWindow.id} --toggle split`
				);
			}

			// Get the top-left window
			const topLeftWindow = this.getTopLeftWindow();

			for (const window of this.windowsData) {
				if (window === topRightWindow || window === topLeftWindow) continue;
				this.executeYabaiCommand(
					`${yabaiPath} -m window ${window.id} --warp ${topLeftWindow.id}`
				);
			}
		},
		/**
		 * If the dividing x-coordinate is 0, then the stack does not exist
		 */
		doesStackExist() {
			return this.getDividingLineXCoordinate() !== 0;
		},
		moveWindowToStack(windowId: string) {
			let win = this.getWindowData({ windowId });

			// If there's only two windows, make sure that the window stack exists
			if (this.windowsData.length === 2) {
				if (win.split === 'horizontal') {
					this.executeYabaiCommand(
						`${yabaiPath} -m window ${win.id} --toggle split`
					);
				}
				return;
			}

			// If the stack exists and the window is already on the stack
			if (this.windowsData.length > 2 && !this.isMainWindow(win)) {
				if (win.split === 'vertical') {
					this.executeYabaiCommand(
						`${yabaiPath} -m window ${win.id} --toggle split`
					);
				}
				return;
			}

			// Find a window that's touching the left side of the screen
			const stackWindow = this.getWidestStackWindow();
			if (stackWindow === undefined) return;

			this.executeYabaiCommand(
				`${yabaiPath} -m window ${windowId} --warp ${stackWindow.id}`
			);

			win = this.getWindowData({ windowId });
			this.refreshWindowsData();

			if (this.windowsData.length === 2) {
				if (win.split === 'horizontal') {
					this.executeYabaiCommand(
						`${yabaiPath} -m window ${stackWindow.id} --toggle split`
					);
				}
			} else {
				if (win.split === 'vertical') {
					this.executeYabaiCommand(
						`${yabaiPath} -m window ${stackWindow.id} --toggle split`
					);
				}
			}

			this.refreshWindowsData();
		},
		moveWindowToMain(windowId: string) {
			let win = this.getWindowData({ windowId });

			// Find a window that's touching the right side of the screen
			const mainWindow = this.getWidestMainWindow();

			if (mainWindow === undefined) return;
			this.executeYabaiCommand(
				`${yabaiPath} -m window ${windowId} --warp ${mainWindow.id}`
			);

			win = this.getWindowData({ windowId });
			if (win.split === 'vertical') {
				this.executeYabaiCommand(
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
		getMiddleWindows() {
			return this.windowsData.filter((window) => this.isMiddleWindow(window));
		},
		getMainWindows() {
			const dividingLineXCoordinate = this.getDividingLineXCoordinate();
			return this.windowsData.filter(
				(window) => window.frame.x >= dividingLineXCoordinate
			);
		},
		/**
		 * If the window's frame has an x of 0, it is a stack window
		 */
		getStackWindows() {
			return this.windowsData.filter((window) => this.isStackWindow(window));
		},
		async isValidLayout(): Promise<
			{ status: true } | { status: false; reason: string }
		> {
			const state = await readState();
			const curNumMainWindows = this.getMainWindows().length;
			if (state.numMainWindows !== curNumMainWindows) {
				return {
					status: false,
					reason: `Number of main windows does not equal expected number of main windows (${curNumMainWindows}/${state.numMainWindows})`,
				};
			}

			for (const window of this.windowsData) {
				if (this.isMiddleWindow(window)) {
					return {
						status: false,
						reason: `A middle window (${window}) was detected.`,
					};
				}
			}

			return { status: true };
		},
		async updateWindows() {
			const layoutValidity = await this.isValidLayout();
			if (layoutValidity.status === true) {
				console.log('Valid layout detected; no changes were made.');
				return;
			}

			const numWindows = this.windowsData.length;

			// If the stack is supposed to exist but doesn't exist
			if (
				this.expectedNumMainWindows !== numWindows &&
				!this.doesStackExist()
			) {
				this.createStack();
			}

			if (numWindows > 2) {
				const mainWindows = this.getMainWindows();
				let curNumMainWindows = mainWindows.length;

				// If there are too many main windows, move them to stack
				if (curNumMainWindows > this.expectedNumMainWindows) {
					console.log(
						`Too many main windows (${curNumMainWindows}/${this.expectedNumMainWindows}).`
					);
					// Sort the windows by reverse y-coordinate and x-coordinate so we remove the bottom-left main windows first
					mainWindows.sort((window1, window2) =>
						window1.frame.y !== window2.frame.y
							? window2.frame.y - window1.frame.y
							: window1.frame.x - window2.frame.x
					);
					while (curNumMainWindows > this.expectedNumMainWindows) {
						const mainWindow = mainWindows.pop()!;
						console.log(`Moving main window ${mainWindow.app} to stack.`);
						this.moveWindowToStack(mainWindow.id.toString());
						curNumMainWindows -= 1;
					}
				}

				// If there are windows that aren't touching either the left side or the right side
				// after the move, fill up main and then move the rest to stack
				let middleWindows;
				while ((middleWindows = this.getMiddleWindows()).length > 0) {
					const middleWindow = middleWindows[0];
					console.log(`Middle window ${middleWindow.app} detected.`);
					if (curNumMainWindows < this.expectedNumMainWindows) {
						console.log(`Moving middle window ${middleWindow.app} to main.`);
						this.moveWindowToMain(middleWindow.id.toString());
						curNumMainWindows += 1;
					} else {
						console.log(`Moving middle window ${middleWindow.app} to stack.`);
						this.moveWindowToStack(middleWindow.id.toString());
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
				while (curNumMainWindows < this.expectedNumMainWindows) {
					const stackWindow = stackWindows.pop()!;
					console.log(`Moving stack window ${stackWindow.app} to main.`);
					this.moveWindowToMain(stackWindow.id.toString());
					curNumMainWindows += 1;
				}
			}

			// Note: the following should never be called
			if ((await this.isValidLayout()).status === false) {
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
