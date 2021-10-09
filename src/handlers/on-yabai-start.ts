import { createInitializedWindowsManager } from '../utils';
import { releaseHandlerLock } from '../utils/handler';
import { handleMasterError } from '../utils/main';

async function main() {
	const { wm, state, display } = await createInitializedWindowsManager();
	try {
	await wm.updateWindows({
		targetNumMasterWindows: state[display.id].numMasterWindows,
	});
} finally {
	await releaseHandlerLock();
}
}

main().catch(handleMasterError);
