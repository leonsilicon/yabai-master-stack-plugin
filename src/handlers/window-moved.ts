import { updateWindows } from '../utils';
import { lockOrQuit, releaseLock } from '../utils/lock';

function main() {
	try {
		lockOrQuit();
		console.log('Starting to handle window_moved.')
		updateWindows();
		console.log('Finished handling window_moved.');
	} finally {
		releaseLock();
	}
}

main();