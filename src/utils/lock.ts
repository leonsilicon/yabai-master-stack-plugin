import fs from 'fs';
import path from 'path';
import pkgDir from 'pkg-dir';

const handlerLockPath = path.join(pkgDir.sync(__dirname)!, 'handler.lock');
export function lockOrQuit() {
	if (fs.existsSync(handlerLockPath)) {
		process.exit(1);
	}
	fs.writeFileSync(handlerLockPath, '');
}

export function releaseLock() {
	fs.rmSync(handlerLockPath);
}
