import { createInitializedWindowsManager } from '../utils';
import { releaseHandlerLock } from '../utils/handler';
import { handleMasterError } from '../utils/main';

async function main() {
	const { wm, state, display } = createInitializedWindowsManager();
	try {
		console.log('Starting to handle window_created.');

		if ((await wm.isValidLayout()).status === true) {
			console.log('Valid layout detected; no changes were made.');
			return;
		}

		const processId = process.env.YABAI_PROCESS_ID as string;
		const windowId = process.env.YABAI_WINDOW_ID as string;
		const curNumMasterWindows = wm.getMasterWindows().length;
		const window = wm.getWindowData({ windowId, processId });

		if (
			curNumMasterWindows > 1 &&
			curNumMasterWindows <= state[display.id].numMasterWindows
		) {
			// move the window to the master
			console.log('Moving newly created window to master.');
			await wm.moveWindowToMaster(window);
		}
		// if there are too many windows on the master
		else {
			console.log('Moving newly created window to stack.');
			// move the window to the stack
			await wm.moveWindowToStack(window);
		}

		await wm.updateWindows({
			targetNumMasterWindows: state[display.id].numMasterWindows,
		});
		console.log('Finished handling window_created.');
	} finally {
		releaseHandlerLock();
	}
}

main().catch(handleMasterError);
