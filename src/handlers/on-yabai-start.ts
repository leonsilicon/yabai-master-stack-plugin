import { readState, writeState } from '../state';
import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { releaseLock } from '../utils/lock';

async function main() {
	try {
		await releaseLock();
		const state = await readState();
		state.numMainWindows = 1;
		await writeState(state);
		const wm = createWindowsManager({ display: getFocusedDisplay() });
		await wm.updateWindows();
	} catch {
		// empty
	}
}

void main();
