import type { Window } from '~/types/yabai.js';
import { logDebug } from '~/utils/log.js';
import { useDefineMethods } from '~/utils/modules.js';
import { isYabai3Window } from '~/utils/yabai.js';

export function masterWindowModule() {
	const defineMethods = useDefineMethods();

	return defineMethods({
		/**
		 * A window which is to the right of the dividing line is considered a master window.
		 */
		isMasterWindow(window: Window) {
			const dividingLineXCoordinate = this.getDividingLineXCoordinate();
			return window.frame.x >= dividingLineXCoordinate;
		},
		getMasterWindows() {
			const dividingLineXCoordinate = this.getDividingLineXCoordinate();
			return this.windowsData.filter(
				(window) => window.frame.x >= dividingLineXCoordinate
			);
		},
		getTopMasterWindow() {
			return this.getTopWindow(this.getMasterWindows());
		},
		getBottomMasterWindow() {
			return this.getBottomWindow(this.getMasterWindows());
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

		async moveWindowToMaster(window: Window) {
			logDebug(() => `Moving window ${window.app} to master.`);
			// Use a small heuristic that helps prevent "glitchy" window rearrangements
			// Only execute this heuristic when the layout isn't a pancake
			if (this.expectedCurrentNumMasterWindows < this.windowsData.length) {
				try {
					await this.executeYabaiCommand(`-m window ${window.id} --warp east`);
				} catch {
					// Empty
				}
			}

			// If the window is already a master window, then don't do anything
			if (this.isMasterWindow(window)) return;

			// Find a window that's touching the right side of the screen
			const masterWindow = this.getWidestMasterWindow();

			if (masterWindow === undefined || masterWindow.id === window.id) return;

			await this.executeYabaiCommand(
				`-m window ${window.id} --warp ${masterWindow.id}`
			);
			window = this.getUpdatedWindowData(window);

			const splitType = isYabai3Window(window)
				? window.split
				: window['split-type'];

			if (splitType === 'vertical') {
				await this.executeYabaiCommand(`-m window ${window.id} --toggle split`);
			}
		},
		/**
		 * Turns the master into a column by making sure the split direction of all the master windows
		 * is horizontal
		 */
		async columnizeMasterWindows() {
			// In this case, we want to columnize all the windows to the left of the dividing line
			const dividingLineXCoordinate = this.getDividingLineXCoordinate();

			const masterWindows = this.windowsData.filter(
				(window) => window.frame.x >= dividingLineXCoordinate
			);
			if (masterWindows.length > 1) {
				for (const masterWindow of masterWindows) {
					const window = this.getUpdatedWindowData(masterWindow);

					const splitType = isYabai3Window(window)
						? window.split
						: window['split-type'];

					if (splitType === 'vertical') {
						// eslint-disable-next-line no-await-in-loop
						await this.executeYabaiCommand(
							`-m window ${window.id} --toggle split`
						);
					}
				}
			}
		},
	});
}
