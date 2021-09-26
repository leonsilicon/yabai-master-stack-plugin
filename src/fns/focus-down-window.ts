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
		// If the focused window is the lowest master window
		if (
			wm.isMasterWindow(focusedWindow) &&
			wm.isBottomWindow(wm.getMasterWindows(), focusedWindow)
		) {
			// Focus on the top stack window
			const windowToFocus = wm.getTopStackWindow() ?? wm.getTopMasterWindow();
			console.log(`Focusing on the window ${windowToFocus?.app}`);
			if (windowToFocus !== undefined) {
				wm.executeYabaiCommand(
					`${yabaiPath} -m window --focus ${windowToFocus.id}`
				);
			}
		} else if (
			wm.isStackWindow(focusedWindow) &&
			wm.isBottomWindow(wm.getStackWindows(), focusedWindow)
		) {
			// Focus on the top master window
			const windowToFocus = wm.getTopMasterWindow();
			console.log(`Focusing on the window ${windowToFocus?.app}`);
			if (windowToFocus !== undefined) {
				wm.executeYabaiCommand(
					`${yabaiPath} -m window --focus ${windowToFocus.id}`
				);
			}
		}
		// Otherwise, just focus south
		else {
			console.log(
				wm.isStackWindow(focusedWindow),
				wm.isBottomWindow(wm.getStackWindows(), focusedWindow)
			);
			wm.executeYabaiCommand(`${yabaiPath} -m window --focus south`);
		}
	} else {
		wm.executeYabaiCommand(`${yabaiPath} -m window --focus first`);
	}
}

main().catch(handleMasterError);
