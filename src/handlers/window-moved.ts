import { createInitializedWindowsManager } from '../utils';
import { handleMasterError } from '../utils/error';
import { releaseLock } from '../utils/lock';

async function main() {
	try {
		const { wm, display, state } = await createInitializedWindowsManager();
		console.log('Starting to handle window_moved.');
		await wm.updateWindows({
			targetNumMasterWindows: state[display.id].numMasterWindows,
		});
		console.log('Finished handling window_moved.');
	} finally {
		await releaseLock();
	}
}

main().catch(handleMasterError);
