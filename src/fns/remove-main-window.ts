import { readState, writeState } from "../state";
import { getFocusedWindow } from "../utils";

const windowId = process.argv[2] ?? getFocusedWindow();

if (windowId !== undefined) {
	const state = readState();
	state.mainWindowIds = state.mainWindowIds.filter((id) => id !== windowId);
	writeState(state);
}