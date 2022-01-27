import type { State } from '~/types/yabai.js';
import { useDefineMethods } from '~/utils/modules.js';
import { writeState } from '~/utils/state.js';

export function stateModule() {
	const defineMethods = useDefineMethods();

	return defineMethods({
		validateState(state: State) {
			if (this.windowsData.length < this.expectedCurrentNumMasterWindows) {
				this.expectedCurrentNumMasterWindows = this.windowsData.length;
				state[this.space.id].numMasterWindows = this.windowsData.length;
			}

			if (state[this.space.id].numMasterWindows <= 0) {
				state[this.space.id].numMasterWindows = 1;
			}

			writeState(state);
		},
	});
}
