import { createInitializedWindowsManager } from '../utils';
import { releaseHandlerLock } from '../utils/handler';
import { handleMasterError } from '../utils/main';

async function main() {
	const { wm, display, state } = createInitializedWindowsManager();
	try {
		console.log('Starting to handle window_moved.');
		await wm.updateWindows({
			targetNumMasterWindows: state[display.id].numMasterWindows,
		});
		console.log('Finished handling window_moved.');
	} finally {
		releaseHandlerLock();
	}
}

main().catch(handleMasterError);
