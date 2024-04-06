import { getFocusedDisplay } from '#utils/display.ts';
import { getFocusedSpace } from '#utils/space.ts';
import { readState } from '#utils/state.ts';
import { WindowsManager } from '#utils/windows-manager/class.ts';
import invariant from 'tiny-invariant';

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
