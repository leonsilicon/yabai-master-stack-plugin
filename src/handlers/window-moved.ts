import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { lockOrQuit, releaseLock } from '../utils/lock';

function main() {
	try {
		const wm = createWindowsManager({ display: getFocusedDisplay() });
		lockOrQuit();
		console.log('Starting to handle window_moved.');
		wm.updateWindows();
		console.log('Finished handling window_moved.');
	} finally {
		releaseLock();
	}
}

main();
