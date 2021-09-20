import { readState } from '../state';
import { getMainWindows, getWindowData, isValidLayout, moveWindowToMain, moveWindowToStack } from '../utils';
import fs from 'fs';

function main() {
	try {
		if (fs.existsSync('handler.lock')) {
			process.exit(1);
		}
		fs.writeFileSync('handler.lock', '');

		console.log('Starting to handle window_created.')

		if (isValidLayout()) {
			console.log('Valid layout detected; no changes were made.');
			return;
		}

		const processId = process.env.YABAI_PROCESS_ID as string;
		const windowId = process.env.YABAI_WINDOW_ID as string;
		const state = readState();
		const curNumMainWindows = getMainWindows().length;
		const window = getWindowData({ windowId, processId });

		// If the main can fit more windows
		if (curNumMainWindows > 1 && curNumMainWindows <= state.numMainWindows) {
			// move the window to the main
			console.log('Moving newly created window to main.');
			moveWindowToMain(window.id.toString());
		} 
		// if there are too many windows on the main
		else {
			console.log('Moving newly created window to stack.');
			// move the window to the stack
			moveWindowToStack(window.id.toString());
		}

		if (!isValidLayout()) {
			throw new Error('window_created handler ended with an invalid layout.');
		}
		console.log('Finished handling window_created.');
	} finally {
		fs.rmSync('handler.lock');
	}
}

main()
