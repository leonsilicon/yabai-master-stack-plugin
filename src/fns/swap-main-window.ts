import { readState, windowsData, writeState } from "../state";
import { getFocusedWindow } from "../utils";

const windowId = process.argv[2] ?? getFocusedWindow();

if (windowId !== undefined) {
	const state = readState();
	state.mainWindowIds = state.mainWindowIds.filter((id) => id !== windowsData[windowsData.length - 1].id.toString());
	state.mainWindowIds.push(windowId);
	writeState(state);
}