import type { Window } from '~/types/yabai.js';
import { logDebug } from '~/utils/log.js';
import { useDefineMethods } from '~/utils/modules.js';

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
			try {
				await this.executeYabaiCommand(`-m window ${window.id} --warp east`);
			} catch {
				// Empty
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

			if (window['split-type'] === 'vertical') {
				await this.executeYabaiCommand(`-m window ${window.id} --toggle split`);
			}
		},
	});
}
