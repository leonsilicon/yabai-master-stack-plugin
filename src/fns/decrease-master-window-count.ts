import { writeState } from '../state';
import type { WMPayload } from '../utils';
import { logDebug } from '../utils/log';

export async function decreaseMasterWindowCount(wmPayload: WMPayload) {
	const { state, space, wm } = wmPayload;
	if (state[space.id].numMasterWindows > 1) {
		// Update the state
		state[space.id].numMasterWindows -= 1;
		writeState(state);
		logDebug(() => 'Decreasing master window count.');
		await wm.updateWindows({
			targetNumMasterWindows: state[space.id].numMasterWindows,
		});
	}
}
