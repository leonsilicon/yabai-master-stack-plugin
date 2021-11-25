import { writeState } from '../state';
import type { WMPayload } from '../utils';
import { logDebug } from '../utils/log';

export async function increaseMasterWindowCount(wmPayload: WMPayload) {
	const { wm, space, state } = wmPayload;
	if (state[space.id].numMasterWindows < wm.windowsData.length - 1) {
		state[space.id].numMasterWindows += 1;
		writeState(state);
		logDebug(() => 'Increasing master window count.');
		await wm.updateWindows({
			targetNumMasterWindows: state[space.id].numMasterWindows,
		});
	}
}
