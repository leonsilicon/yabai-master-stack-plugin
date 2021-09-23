import { createWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { releaseLock } from '../utils/lock';

try {
	releaseLock();
	const wm = createWindowsManager({ display: getFocusedDisplay() });
	wm.updateWindows();
} catch {}
