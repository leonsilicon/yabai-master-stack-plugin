import type { WMPayload } from '../utils';
import { logDebug } from '../utils/log';

export async function windowMoved(wmPayload: WMPayload) {
	const { wm, space, state } = wmPayload;
	logDebug(() => 'Starting to handle window_moved.');
	await wm.updateWindows({
		targetNumMasterWindows: state[space.id].numMasterWindows,
	});
	logDebug(() => 'Finished handling window_moved.');
}
