import { readState } from '../state';
import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { handleMasterError } from '../utils/error';
import { acquireHandlerLock, releaseLock } from '../utils/lock';

async function master() {
	try {
		await acquireHandlerLock();
		const state = await readState();
		const wm = createWindowsManager({
			display: getFocusedDisplay(),
			expectedCurrentNumMasterWindows: state.numMasterWindows,
		});
		console.log('Starting to handle window_created.');

		if ((await wm.isValidLayout()).status === true) {
			console.log('Valid layout detected; no changes were made.');
			return;
		}

		const processId = process.env.YABAI_PROCESS_ID as string;
		const windowId = process.env.YABAI_WINDOW_ID as string;
		const curNumMasterWindows = wm.getMasterWindows().length;
		const window = wm.getWindowData({ windowId, processId });

		if (curNumMasterWindows > 1 && curNumMasterWindows <= state.numMasterWindows) {
			// move the window to the master
			console.log('Moving newly created window to master.');
			wm.moveWindowToMaster(window);
		}
		// if there are too many windows on the master
		else {
			console.log('Moving newly created window to stack.');
			// move the window to the stack
			wm.moveWindowToStack(window);
		}

		await wm.updateWindows({ targetNumMasterWindows: state.numMasterWindows });
		console.log('Finished handling window_created.');
	} finally {
		await releaseLock();
	}
}

master().catch(handleMasterError);
