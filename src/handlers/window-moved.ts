import { createInitializedWindowsManager } from '../utils';
import { releaseLock } from '../utils/lock';
import { handleMasterError } from '../utils/main';

async function main() {
	const { wm, display, state } = await createInitializedWindowsManager();
	console.log('Starting to handle window_moved.');
	await wm.updateWindows({
		targetNumMasterWindows: state[display.id].numMasterWindows,
	});
	console.log('Finished handling window_moved.');
}

main().catch(handleMasterError).finally(releaseLock);
