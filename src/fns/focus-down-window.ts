import { yabaiPath } from '../config';
import { createInitializedWindowsManager } from '../utils';
import { releaseLock } from '../utils/lock';
import { handleMasterError } from '../utils/main';

async function main() {
	const { wm } = await createInitializedWindowsManager();
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
			wm.executeYabaiCommand(`${yabaiPath} -m window --focus south`);
		}
	} else {
		wm.executeYabaiCommand(`${yabaiPath} -m window --focus first`);
	}
}

main().catch(handleMasterError).finally(releaseLock);
