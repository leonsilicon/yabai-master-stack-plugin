import { getConfig } from '#utils/config.ts';
import { lockfilePath } from '#utils/lock.ts';
import type { WindowsManager } from '#utils/windows-manager/class.ts';
import { getYabaiOutput } from '#utils/yabai.ts';
import fs from 'node:fs';
import { parse } from 'shell-quote';

export async function executeYabaiCommand(
	this: WindowsManager,
	command: string,
) {
	const { yabaiPath } = getConfig();
	try {
		// We should check that we still own the lockfile before running the command
		if (fs.readFileSync(lockfilePath, 'utf8') !== process.pid.toString()) {
			throw Object.assign(
				new Error('Lockfile is no longer owned by this process'),
				{ code: 'ELOCKED' },
			);
		}
	} catch {
		// If the file was deleted, we should assume it was deleted by another process
		throw Object.assign(
			new Error('Lockfile is no longer owned by this process'),
			{ code: 'ELOCKED' },
		);
	}

	const yabaiProcess = Bun.spawn([yabaiPath, ...parse(command) as string[]]);
	const yabaiOutput = await getYabaiOutput(yabaiProcess);
	await this.refreshWindowsData();
	return yabaiOutput;
}
