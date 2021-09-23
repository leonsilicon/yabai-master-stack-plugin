import { readState, writeState } from '../state';
import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { releaseLock } from '../utils/lock';

try {
	releaseLock();
	const state = readState();
	state.numMainWindows = 1;
	writeState(state);
	const wm = createWindowsManager({ display: getFocusedDisplay() });
	wm.updateWindows();
} catch {}
