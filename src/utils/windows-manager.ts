import { getFocusedDisplay } from '~/utils/display.js';
import { getFocusedSpace } from '~/utils/space.js';
import { readState } from '~/utils/state.js';
import { createWindowsManager } from '~/windows-manager/create.js';

export async function createInitializedWindowsManager() {
	const state = await readState();
	const display = await getFocusedDisplay();
	const space = await getFocusedSpace();
	const wm = createWindowsManager({
		display,
		space,
		expectedCurrentNumMasterWindows: state[space.id].numMasterWindows,
	});
	await wm.initialize();
	wm.validateState(state);
	return { wm, state, display, space };
}
