import { createWindowsManager } from '../utils';
import { lockOrQuit, releaseLock } from '../utils/lock';

function main() {
	try {
		const wm = createWindowsManager();
		lockOrQuit();
		return;
		console.log('Starting to handle window_moved.');
		wm.updateWindows();
		console.log('Finished handling window_moved.');
	} finally {
		releaseLock();
	}
}

main();
