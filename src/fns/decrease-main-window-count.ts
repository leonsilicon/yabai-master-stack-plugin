import { readState, writeState } from '../state';
import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { handleMainError } from '../utils/error';
import { acquireHandlerLock, releaseLock } from '../utils/lock';

async function main() {
	try {
		await acquireHandlerLock();
		const state = await readState();
		if (state.numMainWindows > 1) {
			const wm = createWindowsManager({
				display: getFocusedDisplay(),
				expectedCurrentNumMainWindows: state.numMainWindows,
			});
			state.numMainWindows -= 1;
			await writeState(state);
			console.log('Decreasing main window count.');
			await wm.updateWindows({ targetNumMainWindows: state.numMainWindows });
		}
	} finally {
		await releaseLock();
	}
}

main().catch(handleMainError);
