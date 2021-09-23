import { readState } from '../state';
import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { handleMainError } from '../utils/error';
import { acquireHandlerLock, releaseLock } from '../utils/lock';

async function main() {
	try {
		await acquireHandlerLock();
		const state = await readState();
		const wm = createWindowsManager({
			display: getFocusedDisplay(),
			numMainWindows: state.numMainWindows,
		});
		console.log('Starting to handle window_created.');

		if ((await wm.isValidLayout()).status === true) {
			console.log('Valid layout detected; no changes were made.');
			return;
		}

		const processId = process.env.YABAI_PROCESS_ID as string;
		const windowId = process.env.YABAI_WINDOW_ID as string;
		const curNumMainWindows = wm.getMainWindows().length;
		const window = wm.getWindowData({ windowId, processId });

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

		await wm.updateWindows();
		console.log('Finished handling window_created.');
	} finally {
		await releaseLock();
	}
}

main().catch(handleMainError);