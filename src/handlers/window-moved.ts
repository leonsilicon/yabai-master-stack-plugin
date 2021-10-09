import { createInitializedWindowsManager } from '../utils';
import { main } from '../utils/main';

main(async () => {
	const { wm, display, state } = createInitializedWindowsManager();
	console.log('Starting to handle window_moved.');
	await wm.updateWindows({
		targetNumMasterWindows: state[display.id].numMasterWindows,
	});
	console.log('Finished handling window_moved.');
});
