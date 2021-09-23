import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { acquireHandlerLock, releaseLock } from '../utils/lock';

async function main() {
	try {
		const wm = createWindowsManager({ display: getFocusedDisplay() });
		await acquireHandlerLock();
		console.log('Starting to handle window_moved.');
		await wm.updateWindows();
		console.log('Finished handling window_moved.');
	} finally {
		await releaseLock();
	}
}

void main();
