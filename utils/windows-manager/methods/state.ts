import type { State } from '#types';
import { writeState } from '#utils/state.ts';
import type { WindowsManager } from '#utils/windows-manager/class.ts';
import invariant from 'tiny-invariant';

export function validateState(this: WindowsManager, state: State) {
	const spaceState = state[this.space.id];
	invariant(spaceState);

	if (this.windowsData.length < this.expectedCurrentNumMasterWindows) {
		this.expectedCurrentNumMasterWindows = this.windowsData.length;
		spaceState.numMasterWindows = this.windowsData.length;
	}

	if (spaceState.numMasterWindows <= 0) {
		spaceState.numMasterWindows = 1;
	}

	writeState(state);
}
