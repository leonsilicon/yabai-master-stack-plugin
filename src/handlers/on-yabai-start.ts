import { createInitializedWindowsManager } from '../utils';
import { releaseHandlerLock } from '../utils/handler';
import { handleMasterError } from '../utils/main';

async function main() {
	const { wm, state, display } = await createInitializedWindowsManager();
	await wm.updateWindows({
		targetNumMasterWindows: state[display.id].numMasterWindows,
	});
}

main().catch(handleMasterError).finally(releaseHandlerLock);
