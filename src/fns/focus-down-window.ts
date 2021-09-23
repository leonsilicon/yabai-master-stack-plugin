import { yabaiPath } from '../config';
import { readState } from '../state';
import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { handleMainError } from '../utils/error';

async function main() {
	const state = await readState();
	const wm = createWindowsManager({
		display: getFocusedDisplay(),
		numMainWindows: state.numMainWindows,
	});
	const focusedWindow = wm.getFocusedWindow();
	if (focusedWindow !== undefined) {
		// If the focused window is the lowest main window
		if (
			wm.isMainWindow(focusedWindow) &&
			wm.isBottomWindow(wm.getMainWindows(), focusedWindow)
		) {
			// Focus on the top stack window
			const topStackWindow = wm.getTopStackWindow();
			if (topStackWindow !== undefined) {
				wm.executeYabaiCommand(
					`${yabaiPath} -m window --focus ${topStackWindow.id}`
				);
			}
		} else if (
			wm.isStackWindow(focusedWindow) &&
			wm.isBottomWindow(wm.getStackWindows(), focusedWindow)
		) {
			// Focus on the top main window
			const topMainWindow = wm.getTopMainWindow();
			if (topMainWindow !== undefined) {
				wm.executeYabaiCommand(
					`${yabaiPath} -m window --focus ${topMainWindow.id}`
				);
			}
		}
		// Otherwise, just focus south
		else {
			wm.executeYabaiCommand(`${yabaiPath} -m window --focus south`);
		}
	} else {
		wm.executeYabaiCommand(`${yabaiPath} -m window --focus first`);
	}
}

main().catch(handleMainError);
