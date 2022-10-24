import { execa } from 'execa';
import { parse } from 'shell-quote';

import { getConfig } from '~/utils/config.js';
import { getYabaiOutput } from '~/utils/yabai.js';
import type { WindowsManager } from '~/windows-manager/class.js';

export async function executeYabaiCommand(
	this: WindowsManager,
	command: string
) {
	const { yabaiPath } = getConfig();
	const yabaiProcess = execa(yabaiPath, parse(command) as string[]);
	const yabaiOutput = await getYabaiOutput(yabaiProcess);
	await this.refreshWindowsData();
	return yabaiOutput;
}
