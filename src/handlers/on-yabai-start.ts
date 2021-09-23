import { createWindowsManager } from '../utils';
import { releaseLock } from '../utils/lock';

try {
	releaseLock();
	const wm = createWindowsManager();
	wm.updateWindows();
} catch {}

