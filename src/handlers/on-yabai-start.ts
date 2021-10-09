import { createInitializedWindowsManager } from '../utils';
import { releaseLock } from '../utils/lock';
import { handleMasterError } from '../utils/main';

async function main() {
	const { wm, state, display } = await createInitializedWindowsManager();
	await wm.updateWindows({
		targetNumMasterWindows: state[display.id].numMasterWindows,
	});
}

main().catch(handleMasterError).finally(releaseLock);
