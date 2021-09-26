import { yabaiPath } from '../config';
import { readState } from '../state';
import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { handleMasterError } from '../utils/error';

async function main() {
	const state = await readState();
	const display = getFocusedDisplay();
	const wm = createWindowsManager({
		display,
		expectedCurrentNumMasterWindows: state[display.id].numMasterWindows,
	});
	const focusedWindow = wm.getFocusedWindow();
	if (focusedWindow !== undefined) {
		// If the focused window is the highest window
		if (
			wm.isMasterWindow(focusedWindow) &&
			wm.isTopWindow(wm.getMasterWindows(), focusedWindow)
		) {
			// Focus on the bottom stack window
			const windowToFocus =
				wm.getBottomStackWindow() ?? wm.getBottomMasterWindow();
			console.log(`Focusing on the window ${windowToFocus.app}`);
			if (windowToFocus !== undefined) {
				wm.executeYabaiCommand(
					`${yabaiPath} -m window --focus ${windowToFocus.id}`
				);
			}
		} else if (
			wm.isStackWindow(focusedWindow) &&
			wm.isTopWindow(wm.getStackWindows(), focusedWindow)
		) {
			// Focus on the bottom master window
			const windowToFocus = wm.getBottomMasterWindow();
			console.log(`Focusing on the window ${windowToFocus.app}`);
			if (windowToFocus !== undefined) {
				wm.executeYabaiCommand(
					`${yabaiPath} -m window --focus ${windowToFocus.id}`
				);
			}
		} else {
			// Otherwise, just focus north
			wm.executeYabaiCommand(`${yabaiPath} -m window --focus north`);
		}
	}
}

main().catch(handleMasterError);
