import { readState, writeState } from "../state";

const state = readState();
if (state.numMainWindows > 1) {
	state.numMainWindows = state.numMainWindows - 1;
	writeState(state);
}