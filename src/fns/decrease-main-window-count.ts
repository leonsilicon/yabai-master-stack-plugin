import { readState, writeState } from "../state";
import { updateWindows } from "../utils";
import { lockOrQuit, releaseLock } from "../utils/lock";

function main() {
	try {
		lockOrQuit();
		const state = readState();
		if (state.numMainWindows > 1) {
			state.numMainWindows = state.numMainWindows - 1;
			writeState(state);
			console.log('Decreasing main window count.')
			updateWindows();
		}
	} finally {
		releaseLock();
	}
}

main();