import { readState } from '../state';
import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { acquireHandlerLock, releaseLock } from '../utils/lock';

function main() {
	try {
		acquireHandlerLock();
		const wm = createWindowsManager({ display: getFocusedDisplay() });
		console.log('Starting to handle window_created.');

		if (wm.isValidLayout().status === true) {
			console.log('Valid layout detected; no changes were made.');
			return;
		}

		const processId = process.env.YABAI_PROCESS_ID as string;
		const windowId = process.env.YABAI_WINDOW_ID as string;
		const curNumMainWindows = wm.getMainWindows().length;
		const window = wm.getWindowData({ windowId, processId });

		const state = readState();
		if (curNumMainWindows > 1 && curNumMainWindows <= state.numMainWindows) {
			// move the window to the main
			console.log('Moving newly created window to main.');
			wm.moveWindowToMain(window.id.toString());
		}
		// if there are too many windows on the main
		else {
			console.log('Moving newly created window to stack.');
			// move the window to the stack
			wm.moveWindowToStack(window.id.toString());
		}
		wm.updateWindows();
		console.log('Finished handling window_created.');
	} finally {
		releaseLock();
	}
}

main();
