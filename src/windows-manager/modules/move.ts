import type { Window } from '~/types/yabai.js';
import { logDebug } from '~/utils/log.js';
import { useDefineMethods } from '~/utils/modules.js';

export function moveModule() {
	const defineMethods = useDefineMethods();

	return defineMethods({
		async moveWindowToStack(window: Window) {
			logDebug(() => `Moving window ${window.app} to stack.`);

			logDebug(() => 'moving window west');
			// Use a small heuristic that helps prevent "glitchy" window rearrangements
			try {
				await this.executeYabaiCommand(`-m window ${window.id} --warp west`);
			} catch {
				// Empty
			}

			await this.columnizeStackWindows();

			// If there's only two windows, make sure that the window stack exists
			if (this.windowsData.length === 2) {
				if (window['split-type'] === 'horizontal') {
					await this.executeYabaiCommand(
						`-m window ${window.id} --toggle split`
					);
				}

				return;
			}

			// Don't do anything if the window is already a stack window
			if (this.isStackWindow(window)) {
				return;
			}

			// Find a window that's touching the left side of the screen
			const stackWindow = this.getWidestStackWindow();

			if (stackWindow === undefined || stackWindow.id === window.id) {
				return;
			}

			await this.executeYabaiCommand(
				`-m window ${window.id} --warp ${stackWindow.id}`
			);
			window = this.getUpdatedWindowData(window);

			if (this.windowsData.length === 2) {
				if (window['split-type'] === 'horizontal') {
					await this.executeYabaiCommand(
						`-m window ${window.id} --toggle split`
					);
				}
			} else {
				if (window['split-type'] === 'vertical') {
					await this.executeYabaiCommand(
						`-m window ${window.id} --toggle split`
					);
				}
			}
		},
	});
}
