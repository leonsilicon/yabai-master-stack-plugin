import { writeState } from '../state';
import { createInitializedWindowsManager } from '../utils';
import { releaseHandlerLock } from '../utils/handler';
import { handleMasterError } from '../utils/main';

async function main() {
	const { wm, display, state } = await createInitializedWindowsManager();
	if (state[display.id].numMasterWindows < wm.windowsData.length) {
		state[display.id].numMasterWindows += 1;
		await writeState(state);
		console.log('Increasing master window count.');
		await wm.updateWindows({
			targetNumMasterWindows: state[display.id].numMasterWindows,
		});
	}
}

main().catch(handleMasterError).finally(releaseHandlerLock);
