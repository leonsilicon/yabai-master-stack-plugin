import type { Window } from '~/types/index.js';
import { logDebug } from '~/utils/index.js';
import { useDefineMethods } from '~/utils/modules.js';

export function stackWindowsModule() {
	const defineMethods = useDefineMethods();

	return defineMethods({
		/**
		 * If the window's frame has an x equal to the x of the display, it is a stack window
		 */
		isStackWindow(window: Window) {
			return this.isWindowTouchingLeftEdge(window);
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
		getTopStackWindow() {
			return this.getTopWindow(this.getStackWindows());
		},
		getBottomStackWindow() {
			return this.getBottomWindow(this.getStackWindows());
		},

		/**
		 * In the event that the windows get badly rearranged and all the windows span the entire width of
		 * the screen, split the top-right window vertically and then move the windows into the split
		 */
		async createStack() {
			logDebug(() => 'Creating stack...');
			let topRightWindow = this.getTopRightWindow();
			if (topRightWindow === undefined) return;
			logDebug(() => `Top-right window: ${topRightWindow?.app ?? ''}`);

			if (topRightWindow.split === 'horizontal') {
				await this.executeYabaiCommand(
					`-m window ${topRightWindow.id} --toggle split`
				);
				topRightWindow = this.getTopRightWindow();
			}

			await this.columnizeStackWindows();
		},
		/**
		 * If the top-right window has a x-coordinate of 0, or if the stack dividing
		 * line is equal to 0, then the stack does not exist
		 */
		doesStackExist() {
			const topRightWindow = this.getTopRightWindow();
			if (topRightWindow === undefined) return false;
			return topRightWindow.frame.x !== 0;
		},
		/**
		 * Turns the stack into a column by making sure the split direction of all the stack windows
		 * is horizontal
		 */
		async columnizeStackWindows() {
			// In this case, we want to columnize all the windows to the left of the dividing line
			const dividingLineXCoordinate = this.getDividingLineXCoordinate();

			const stackWindows = this.windowsData.filter(
				(window) => window.frame.x < dividingLineXCoordinate
			);
			if (stackWindows.length > 1) {
				for (const stackWindow of stackWindows) {
					const window = this.getUpdatedWindowData(stackWindow);
					if (window.split === 'vertical') {
						// eslint-disable-next-line no-await-in-loop
						await this.executeYabaiCommand(
							`-m window ${window.id} --toggle split`
						);
					}
				}
			}
		},

		getStackWindows() {
			return this.windowsData.filter((window) => this.isStackWindow(window));
		},
	});
}
