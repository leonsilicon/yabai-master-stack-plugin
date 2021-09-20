import { readState, windowsData } from '../state';
import { getMainWindows, isMiddleWindow, isValidLayout, moveWindowToMain, moveWindowToStack } from '../utils';
import fs from 'fs';

const numWindows = windowsData.length

function main() {
	try {
		if (fs.existsSync('handler.lock')) {
			process.exit(1);
		}
		fs.writeFileSync('handler.lock', '')

		console.log('Starting to handle window_moved.')
		if (isValidLayout()) {
			console.log('Valid layout detected; no changes were made.')
			return;
		}

		if (numWindows > 2) {
			const mainWindows = getMainWindows();
			let curNumMainWindows = mainWindows.length;
			const state = readState();

			// If there are too many main windows, move them to stack
			if (curNumMainWindows > state.numMainWindows) {
				console.log('Too many main windows.')
				while (curNumMainWindows > state.numMainWindows) {
					const mainWindow = mainWindows.pop()!;
					moveWindowToStack(mainWindow.id.toString());
					curNumMainWindows -= 1;
				}
			}

			// If there are windows that aren't touching either the left side or the right side 
			// after the move, fill up main and then move the rest to stack
			for (const window of windowsData) {
				if (isMiddleWindow(window)) {
					console.log('Middle window detected.');
					if (curNumMainWindows < state.numMainWindows) {
						console.log('Moving middle window to main.');
						moveWindowToMain(window.id.toString())
						curNumMainWindows += 1;
					} else {
						console.log('Moving middle window to stack.');
						moveWindowToStack(window.id.toString());
					}
				}
			}
		}

		if (!isValidLayout()) {
			throw new Error('window_moved handler ended with an invalid layout.');
		}
		console.log('Finished handling window_moved.');
	} finally {
		fs.rmSync('handler.lock');
	}
}

main();