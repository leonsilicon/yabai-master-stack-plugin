import invariant from 'tiny-invariant';

import { getFocusedDisplay } from '~/utils/display.js';
import { getFocusedSpace } from '~/utils/space.js';
import { readState } from '~/utils/state.js';
import { WindowsManager } from '~/utils/windows-manager/class.js';

export async function createInitializedWindowsManager() {
	const state = await readState();
	const display = await getFocusedDisplay();
	const space = await getFocusedSpace();
	const spaceState = state[space.id];
	invariant(spaceState);
	const wm = new WindowsManager({
		display,
		space,
		expectedCurrentNumMasterWindows: spaceState.numMasterWindows,
	});
	await wm.initialize();
	wm.validateState(state);
	return { wm, state, display, space };
}
