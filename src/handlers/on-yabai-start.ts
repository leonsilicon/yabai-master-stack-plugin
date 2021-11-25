import type { WMPayload } from '../utils';

export async function onYabaiStart(wmPayload: WMPayload) {
	const { wm, state, space } = wmPayload;
	await wm.updateWindows({
		targetNumMasterWindows: state[space.id].numMasterWindows,
	});
}