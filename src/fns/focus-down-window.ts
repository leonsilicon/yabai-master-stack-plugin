import type { WMPayload } from '../utils';
import { logDebug } from '../utils/log';

export async function focusDownWindow(wmPayload: WMPayload) {
	const { wm } = wmPayload;
	const focusedWindow = wm.getFocusedWindow();
	logDebug(() => `Focused window: ${focusedWindow?.app}`);
	if (focusedWindow !== undefined) {
		// If the focused window is the lowest master window
		if (
			wm.isMasterWindow(focusedWindow) &&
			wm.isBottomWindow(wm.getMasterWindows(), focusedWindow)
		) {
			// Focus on the top stack window
			const windowToFocus = wm.getTopStackWindow() ?? wm.getTopMasterWindow();
			logDebug(() => `Focusing on the window ${windowToFocus?.app}`);
			if (windowToFocus !== undefined) {
				await wm.executeYabaiCommand(`-m window --focus ${windowToFocus.id}`);
			}
		} else if (
			wm.isStackWindow(focusedWindow) &&
			wm.isBottomWindow(wm.getStackWindows(), focusedWindow)
		) {
			// Focus on the top master window
			const windowToFocus = wm.getTopMasterWindow();
			logDebug(() => `Focusing on the window ${windowToFocus?.app}`);
			if (windowToFocus !== undefined) {
				await wm.executeYabaiCommand(`-m window --focus ${windowToFocus.id}`);
			}
		}
		// Otherwise, just focus south
		else {
			await wm.executeYabaiCommand(`-m window --focus south`);
		}
	} else {
		await wm.executeYabaiCommand(`-m window --focus first`);
	}
}
