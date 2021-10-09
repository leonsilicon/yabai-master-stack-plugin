import { createInitializedWindowsManager } from '../utils';
import { main } from '../utils/main';

main(async () => {
	console.log(`${process.pid} start down`);
	const { wm } = await createInitializedWindowsManager();
	await wm.initialize();
	console.log(`${process.pid} down 1`);
	const focusedWindow = wm.getFocusedWindow();
	console.log(`${process.pid} down 2`);
	if (focusedWindow !== undefined) {
		console.log(`${process.pid} down 3`);
		// If the focused window is the lowest master window
		if (
			wm.isMasterWindow(focusedWindow) &&
			wm.isBottomWindow(wm.getMasterWindows(), focusedWindow)
		) {
			console.log(`${process.pid} down 4`);
			// Focus on the top stack window
			const windowToFocus = wm.getTopStackWindow() ?? wm.getTopMasterWindow();
			console.log(`${process.pid} down 5`);
			console.log(`Focusing on the window ${windowToFocus?.app}`);
			console.log(`${process.pid} down 6`);
			if (windowToFocus !== undefined) {
				await wm.executeYabaiCommand(`-m window --focus ${windowToFocus.id}`);
			}
			console.log(`${process.pid} down 7`);
		} else if (
			wm.isStackWindow(focusedWindow) &&
			wm.isBottomWindow(wm.getStackWindows(), focusedWindow)
		) {
			console.log(`${process.pid} down 8`);
			// Focus on the top master window
			const windowToFocus = wm.getTopMasterWindow();
			console.log(`${process.pid} down 9`);
			console.log(`Focusing on the window ${windowToFocus?.app}`);
			if (windowToFocus !== undefined) {
			console.log(`${process.pid} down 10`);
				await wm.executeYabaiCommand(`-m window --focus ${windowToFocus.id}`);
			console.log(`${process.pid} down 11`);
			}

			console.log(`${process.pid} down 12`);
		}
		// Otherwise, just focus south
		else {
			console.log(`${process.pid} down 13`);
			await wm.executeYabaiCommand(`-m window --focus south`);
			console.log(`${process.pid} down 14`);
		}
	} else {
			console.log(`${process.pid} down 15`);
		await wm.executeYabaiCommand(`-m window --focus first`);
			console.log(`${process.pid} down 16`);
	}
	console.log(`${process.pid} end down`);
});
