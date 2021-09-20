import fs from "fs";

export function lockOrQuit() {
	if (fs.existsSync('handler.lock')) {
		process.exit(1);
	} 
	fs.writeFileSync('handler.lock', '');
}

export function releaseLock() {
	fs.rmSync('handler.lock');
}