import { createInitializedWindowsManager } from '../utils';
import { handleMasterError } from '../utils/error';

async function main() {
	try {
		const { wm, state, display } = await createInitializedWindowsManager();
		await wm.updateWindows({
			targetNumMasterWindows: state[display.id].numMasterWindows,
		});
	} catch {
		// empty
	}
}

main().catch(handleMasterError);
