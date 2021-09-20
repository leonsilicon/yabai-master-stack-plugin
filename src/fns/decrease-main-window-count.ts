import { readState, writeState } from "../state";
import { updateWindows } from "../utils";
import { lockOrQuit, releaseLock } from "../utils/lock";

const state = readState();
if (state.numMainWindows > 1) {
	state.numMainWindows = state.numMainWindows - 1;
	writeState(state);
}

function main() {
	try {
		lockOrQuit();
		console.log('Decreasing main window count.')
		updateWindows();
	} finally {
		releaseLock();
	}
}

main();