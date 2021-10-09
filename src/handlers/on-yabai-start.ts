import { releaseStateLock } from '../state';
import { createInitializedWindowsManager } from '../utils';
import { releaseHandlerLock } from '../utils/handler';
import { handleMasterError } from '../utils/main';

async function main() {
	releaseHandlerLock({ force: true });
	releaseStateLock({ force: true });
	const { wm, state, display } = createInitializedWindowsManager();
	await wm.updateWindows({
		targetNumMasterWindows: state[display.id].numMasterWindows,
	});
}

main().catch(handleMasterError);
