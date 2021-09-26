import execa from 'execa';

import { yabaiPath } from '../config';
import type { Display, Window } from '../types';

/**
 * Creates a windows manager.
 * @param props
 * @param props.expectedCurrentNumMasterWindows The expected current number of master
 * windows active on the screen (used as part of a heuristic for determining the master
 * windows).
 */
export function createWindowsManager({
	display,
	expectedCurrentNumMasterWindows,
}: {
	display: Display;
	expectedCurrentNumMasterWindows: number;
}) {
	type GetWindowDataProps = { processId?: string; windowId?: string };

	function getWindowsData() {
		const windowsData = (
			JSON.parse(
				execa.commandSync(`${yabaiPath} -m query --windows`).stdout
			) as Window[]
		).filter(
			(window) => window.split !== 'none' && window.display === display.index
		);
		return windowsData;
	}

	const windowsManager = {
		expectedCurrentNumMasterWindows,
		windowsData: getWindowsData(),
		refreshWindowsData() {
			const newWindowsData = getWindowsData();
			this.windowsData = newWindowsData;
		},
		getUpdatedWindowData(window: Window) {
			return this.windowsData.find((win) => window.id === win.id)!;
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
		 * There is always a line dividing the master windows from the secondary windows. To find this line,
		 * we use two master observations:
		 * 1. The top-right window is always on the right side of the dividing line.
		 * 2. If there is more than one master window, the dividing line must cross the left side of two
		 * windows
		 * Using these observations, we can loop through the windows in descending x-coordinate starting from the top-right window
		 * and for each pair of windows that share x-coordinates, we check if the numMasterWindows is less
		 * than the number of windows we've iterated through, and if so, return the x-coordinate of the currently
		 * processed window
		 */
		getDividingLineXCoordinate() {
			const topRightWindow = this.getTopRightWindow();
			console.log(`Top-right window: ${topRightWindow.app}`);

			if (this.expectedCurrentNumMasterWindows === 1)
				return topRightWindow.frame.x;

			const nonStackWindows = this.windowsData.filter(
				(window) => !this.isStackWindow(window)
			);
			// Get all the windows to the left of the top-right window which are not a stack window
			const eligibleWindows = nonStackWindows
				.filter((window) => window.frame.x <= topRightWindow.frame.x)
				.sort((window1, window2) => window2.frame.x - window1.frame.x);

			const numWindowsToRightOfTopRightWindow =
				nonStackWindows.length - eligibleWindows.length;

			// If there are enough windows that are to the right of the top-right window, then return
			// the top-right window's x-coordinate
			if (
				numWindowsToRightOfTopRightWindow >=
				this.expectedCurrentNumMasterWindows
			) {
				return topRightWindow.frame.x;
			}

			// Otherwise, iterate through the eligible windows in order and find pairs of windows
			for (let i = 0; i < eligibleWindows.length - 1; i += 1) {
				const curWindow = eligibleWindows[i];
				const nextWindow = eligibleWindows[i + 1];
				if (
					curWindow.frame.x === nextWindow.frame.x &&
					numWindowsToRightOfTopRightWindow + i + 2 >=
						this.expectedCurrentNumMasterWindows
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
			const leftWindows = this.windowsData.filter((window) =>
				this.isStackWindow(window)
			);
			let topLeftWindow = leftWindows[0];
			for (const window of leftWindows) {
				if (window.frame.y <= topLeftWindow.frame.y) {
					topLeftWindow = window;
				}
			}
			return topLeftWindow;
		},
		/*
		 * The top-right window is the rightmost window with the lowest y-coordinate.
		 */
		getTopRightWindow() {
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
		getWidestMasterWindow() {
			let widestMasterWindow: Window | undefined;
			for (const window of this.getMasterWindows()) {
				if (
					widestMasterWindow === undefined ||
					window.frame.w > widestMasterWindow.frame.w
				) {
					widestMasterWindow = window;
				}
			}
			return widestMasterWindow;
		},
		// In the event that the windows get badly rearranged and all the windows span the entire width of
		// the screen, split the top-right window vertically and then move the windows into the split
		createStack() {
			console.log('Creating stack...');
			let topRightWindow = this.getTopRightWindow();
			console.log(`Top-right window: ${topRightWindow.app}`);

			if (topRightWindow.split === 'horizontal') {
				this.executeYabaiCommand(
					`${yabaiPath} -m window ${topRightWindow.id} --toggle split`
				);
				topRightWindow = this.getTopRightWindow();
			}

			// Get the top-left window
			const topLeftWindow = this.getTopLeftWindow();
			console.log(`Top-left window: ${topLeftWindow.app}`);

			if (topRightWindow === topLeftWindow) {
				throw new Error('Top-right window should never equal top-left window.');
			}

			for (const window of this.windowsData) {
				if (window === topRightWindow || window === topLeftWindow) continue;
				this.executeYabaiCommand(
					`${yabaiPath} -m window ${window.id} --warp ${topLeftWindow.id}`
				);
			}

			this.expectedCurrentNumMasterWindows = 1;
			this.columnizeStackWindows();
		},
		/**
		 * If the top-right window has a x-coordinate of 0, or if the stack dividing
		 * line is equal to 0, then the stack does not exist
		 */
		doesStackExist() {
			const topRightWindow = this.getTopRightWindow();
			return topRightWindow.frame.x !== 0;
		},
		/**
		 * Turns the stack into a column by making sure the split direction of all the stack windows
		 * is horizontal
		 */
		columnizeStackWindows() {
			const stackWindows = this.windowsData.filter(
				(window) => !this.isMasterWindow(window)
			);
			for (const stackWindow of stackWindows) {
				const window = this.getUpdatedWindowData(stackWindow);
				if (window.split === 'vertical') {
					this.executeYabaiCommand(
						`${yabaiPath} -m window ${window.id} --toggle split`
					);
				}
			}
		},
		moveWindowToStack(window: Window) {
			// Use a small heuristic that helps prevent "glitchy" window rearrangements
			try {
				this.executeYabaiCommand(
					`${yabaiPath} -m window ${window.id} warp west`
				);
			} catch {
				/* empty */
			}

			// If there's only two windows, make sure that the window stack exists
			if (this.windowsData.length === 2) {
				if (window.split === 'horizontal') {
					this.executeYabaiCommand(
						`${yabaiPath} -m window ${window.id} --toggle split`
					);
				}
				return;
			}

			this.columnizeStackWindows();

			// Find a window that's touching the left side of the screen
			const stackWindow = this.getWidestStackWindow();

			if (stackWindow === undefined || stackWindow.id === window.id) {
				return;
			}

			this.executeYabaiCommand(
				`${yabaiPath} -m window ${window.id} --warp ${stackWindow.id}`
			);
			window = this.getUpdatedWindowData(window);

			if (this.windowsData.length === 2) {
				if (window.split === 'horizontal') {
					this.executeYabaiCommand(
						`${yabaiPath} -m window ${stackWindow.id} --toggle split`
					);
				}
			} else {
				if (window.split === 'vertical') {
					this.executeYabaiCommand(
						`${yabaiPath} -m window ${stackWindow.id} --toggle split`
					);
				}
			}
		},
		moveWindowToMaster(window: Window) {
			// Use a small heuristic that helps prevent "glitchy" window rearrangements
			try {
				this.executeYabaiCommand(
					`${yabaiPath} -m window ${window.id} warp east`
				);
			} catch {
				/* empty */
			}

			// Find a window that's touching the right side of the screen
			const masterWindow = this.getWidestMasterWindow();

			if (masterWindow === undefined || masterWindow.id === window.id) return;
			this.executeYabaiCommand(
				`${yabaiPath} -m window ${window.id} --warp ${masterWindow.id}`
			);
			window = this.getUpdatedWindowData(window);

			if (window.split === 'vertical') {
				this.executeYabaiCommand(
					`${yabaiPath} -m window ${masterWindow.id} --toggle split`
				);
			}
		},
		/**
		 * A window which is to the right of the dividing line is considered a master window.
		 */
		isMasterWindow(window: Window) {
			const dividingLineXCoordinate = this.getDividingLineXCoordinate();
			return window.frame.x >= dividingLineXCoordinate;
		},
		/**
		 * If the window's frame has an x equal to the x of the display, it is a stack window
		 */
		isStackWindow(window: Window) {
			return window.frame.x === display.frame.x;
		},
		isMiddleWindow(window: Window) {
			return !this.isStackWindow(window) && !this.isMasterWindow(window);
		},
		getMiddleWindows() {
			return this.windowsData.filter((window) => this.isMiddleWindow(window));
		},
		getMasterWindows() {
			const dividingLineXCoordinate = this.getDividingLineXCoordinate();
			return this.windowsData.filter(
				(window) => window.frame.x >= dividingLineXCoordinate
			);
		},
		getStackWindows() {
			return this.windowsData.filter((window) => this.isStackWindow(window));
		},
		async isValidLayout(props?: {
			targetNumMasterWindows?: number;
		}): Promise<{ status: true } | { status: false; reason: string }> {
			const targetNumMasterWindows =
				props?.targetNumMasterWindows ?? this.expectedCurrentNumMasterWindows;
			console.log('Starting valid layout check...');
			const curNumMasterWindows = this.getMasterWindows().length;
			if (targetNumMasterWindows !== curNumMasterWindows) {
				return {
					status: false,
					reason: `Number of master windows does not equal expected number of master windows (${curNumMasterWindows}/${targetNumMasterWindows})`,
				};
			}

			for (const window of this.windowsData) {
				if (this.isMiddleWindow(window)) {
					console.log(this.isStackWindow(window), this.isMasterWindow(window));
					return {
						status: false,
						reason: `A middle window (${window.app}) was detected.`,
					};
				}
			}

			return { status: true };
		},
		async updateWindows({
			targetNumMasterWindows,
		}: {
			targetNumMasterWindows: number;
		}) {
			console.log('updateWindows() called');
			const layoutValidity = await this.isValidLayout({
				targetNumMasterWindows,
			});
			if (layoutValidity.status === true) {
				console.log('Valid layout detected; no changes were made.');
				return;
			} else {
				console.log('Invalid layout detected...updating windows.');
			}

			const numWindows = this.windowsData.length;

			// If the stack is supposed to exist but doesn't exist
			if (targetNumMasterWindows !== numWindows && !this.doesStackExist()) {
				console.log('Stack does not exist, creating it...');
				this.createStack();
			}

			if (numWindows > 2) {
				const masterWindows = this.getMasterWindows();
				console.log(
					`Master windows: ${masterWindows.map((window) => window.app)}`
				);
				let curNumMasterWindows = masterWindows.length;

				// If there are too many master windows, move them to stack
				if (curNumMasterWindows > targetNumMasterWindows) {
					console.log(
						`Too many master windows (${curNumMasterWindows}/${targetNumMasterWindows}).`
					);
					// Sort the windows from bottom to top and then right to left
					masterWindows.sort((window1, window2) =>
						window1.frame.y !== window2.frame.y
							? window1.frame.y - window2.frame.y
							: window1.frame.x - window2.frame.x
					);

					while (curNumMasterWindows > targetNumMasterWindows) {
						// Remove the window with the greatest y-coordinate first
						const masterWindow = masterWindows.pop()!;

						console.log(`Moving master window ${masterWindow.app} to stack.`);
						this.moveWindowToStack(masterWindow);
						curNumMasterWindows -= 1;
					}
				}

				// If there are windows that aren't touching either the left side or the right side
				// after the move, fill up master and then move the rest to stack
				let middleWindows;
				while ((middleWindows = this.getMiddleWindows()).length > 0) {
					const middleWindow = middleWindows[0];
					console.log(`Middle window ${middleWindow.app} detected.`);
					if (curNumMasterWindows < targetNumMasterWindows) {
						console.log(`Moving middle window ${middleWindow.app} to master.`);
						this.moveWindowToMaster(middleWindow);
						curNumMasterWindows += 1;
					} else {
						console.log(`Moving middle window ${middleWindow.app} to stack.`);
						this.moveWindowToStack(middleWindow);
					}
				}

				// If there are still not enough master windows, move some of the stack windows to master
				const stackWindows = this.getStackWindows();
				// Sort the stack windows by reverse y-coordinate and reverse x-coordinate to move the
				// bottom-rightmost windows first
				stackWindows.sort((window1, window2) =>
					window1.frame.x !== window2.frame.x
						? window2.frame.x - window1.frame.x
						: window2.frame.y - window1.frame.y
				);

				while (curNumMasterWindows < targetNumMasterWindows) {
					console.log(
						`Not enough master windows (${curNumMasterWindows}/${targetNumMasterWindows})`
					);
					const stackWindow = stackWindows.pop()!;
					console.log(`Moving stack window ${stackWindow.app} to master.`);
					this.moveWindowToMaster(stackWindow);
					curNumMasterWindows += 1;
				}
			}

			// Note: the following should never be called
			if (
				(await this.isValidLayout({ targetNumMasterWindows })).status === false
			) {
				throw new Error(
					`updateLayout() ended with an invalid layout; reason: ${layoutValidity.reason}`
				);
			} else {
				console.log('updateLayout() was successful.');
			}

			this.expectedCurrentNumMasterWindows = targetNumMasterWindows;
		},
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
		getTopStackWindow() {
			return this.getTopWindow(this.getStackWindows());
		},
		getBottomStackWindow() {
			return this.getBottomWindow(this.getStackWindows());
		},
		getTopMasterWindow() {
			return this.getTopWindow(this.getMasterWindows());
		},
		getBottomMasterWindow() {
			return this.getBottomWindow(this.getMasterWindows());
		},
	};

	return windowsManager;
}
