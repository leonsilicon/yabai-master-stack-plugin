import { readState, writeState } from "../state";

const state = readState();
state.numMainWindows = state.numMainWindows + 1;
writeState(state);