import { readState, writeState } from "../state";

// Remove the window ID from the list of main windows
const state = readState();
state.mainWindowIds = state.mainWindowIds.filter((id) => id !== process.env.YABAI_WINDOW_ID);
writeState(state);