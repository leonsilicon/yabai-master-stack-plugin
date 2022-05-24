import { getConfig, logDebug } from '~/utils/index.js';
import { useDefineMethods } from '~/utils/modules.js';

export function dividingLineModule() {
	const defineMethods = useDefineMethods();

	return defineMethods({
		/**
			There is always a "line" dividing the master windows from the secondary windows. To find this line, we use two observations (the following apply for a master position on the right):
			1. The top-right window is always on the right side of the dividing line.
			2. If there is more than one master window, the dividing line must cross the left side of two windows.
			Using these observations, we can loop through the windows in descending x-coordinate starting from the top-right window and for each pair of windows that share x-coordinates, we check if the numMasterWindows is less than the number of windows we've iterated through, and if so, return the x-coordinate of the currently processed window.

			If the master position is on the left, then we start searching starting from the top-left window.
		 */
		getDividingLineXCoordinate(): number {
			if (getConfig().masterPosition === 'right') {
				const topRightWindow = this.getTopRightWindow();
				if (topRightWindow === undefined) {
					throw new Error(
						'getDividingLineXCoordinate() was called when there are no windows.'
					);
				}

				logDebug(() => `Top-right window: ${topRightWindow.app}`);

				if (this.expectedCurrentNumMasterWindows === 1) {
					return topRightWindow.frame.x;
				}

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
			} else {
				const topLeftWindow = this.getTopLeftWindow();
				if (topLeftWindow === undefined) {
					throw new Error(
						'getDividingLineXCoordinate() was called when there are no windows.'
					);
				}

				logDebug(() => `Top-left window: ${topLeftWindow.app}`);

				const nonMasterWindows = this.windowsData
					.filter((window) => !this.isWindowTouchingLeftEdge(window))
					.sort((window1, window2) => window1.frame.x - window2.frame.x);

				const numMasterWindows =
					this.windowsData.length - nonMasterWindows.length;

				if (numMasterWindows >= this.expectedCurrentNumMasterWindows) {
					return nonMasterWindows[0].frame.x;
				}

				// Otherwise, if there aren't enough windows to the left of the dividing line, iterate through the windows in order of ascending x-coordinate and find pairs of windows
				for (let i = 0; i < nonMasterWindows.length - 1; i += 1) {
					const curWindow = nonMasterWindows[i];
					const nextWindow = nonMasterWindows[i + 1];
					if (
						curWindow.frame.x === nextWindow.frame.x &&
						numMasterWindows + i + 2 >= this.expectedCurrentNumMasterWindows
					) {
						return curWindow.frame.x;
					}
				}

				// If a pair of windows could not be found (which means all the windows are side-by-side), just return the coordinate of the leftmost window which is not touching the left edge.
				return nonMasterWindows[0].frame.x;
			}
		},
	});
}
