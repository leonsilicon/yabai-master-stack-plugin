import type { Window } from '#types';
import { getConfig } from '#utils/config.ts';
import { debug } from '#utils/debug.ts';
import type { WindowsManager } from '#utils/windows-manager/class.ts';

export async function moveWindowToStack(this: WindowsManager, window: Window) {
	if (this.expectedCurrentNumMasterWindows === this.windowsData.length) {
		debug(
			() =>
				`Skipped moving window ${window.app} to stack because there is no stack.`
		);
		return;
	}

	debug(() => `Moving window ${window.app} to stack.`);

	// // Use a small heuristic that helps prevent "glitchy" window rearrangements
	// try {
	// 	if (getConfig().masterPosition === 'right') {
	// 		await this.executeYabaiCommand(`-m window ${window.id} --warp west`);
	// 	} else {
	// 		await this.executeYabaiCommand(`-m window ${window.id} --warp east`);
	// 	}
	// } catch {
	// 	// Empty
	// }

	await this.columnizeStackWindows();

	// If there's only two windows, make sure that the window stack exists
	if (this.windowsData.length === 2) {
		const splitType = window['split-type'];

		if (splitType === 'horizontal') {
			await this.executeYabaiCommand(`-m window ${window.id} --toggle split`);
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

	const splitType = window['split-type'];

	if (this.windowsData.length === 2) {
		if (splitType === 'horizontal') {
			await this.executeYabaiCommand(`-m window ${window.id} --toggle split`);
		}
	} else {
		if (splitType === 'vertical') {
			await this.executeYabaiCommand(`-m window ${window.id} --toggle split`);
		}
	}
}
