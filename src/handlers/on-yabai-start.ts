import { createInitializedWindowsManager } from '../utils';
import { releaseHandlerLock } from '../utils/handler';
import { handleMasterError } from '../utils/main';

async function main() {
	const { wm, state, display } = createInitializedWindowsManager();
	try {
	await wm.updateWindows({
		targetNumMasterWindows: state[display.id].numMasterWindows,
	});
} finally {
	releaseHandlerLock();
}
}

main().catch(handleMasterError);
