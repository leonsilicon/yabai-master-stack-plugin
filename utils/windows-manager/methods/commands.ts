import { getConfig } from '#utils/config.ts';
import type { WindowsManager } from '#utils/windows-manager/class.ts';
import { getYabaiOutput } from '#utils/yabai.ts';
import { parse } from 'shell-quote';

export async function executeYabaiCommand(
	this: WindowsManager,
	command: string,
) {
	const { yabaiPath } = getConfig();
	const yabaiProcess = Bun.spawn([yabaiPath, ...parse(command) as string[]]);
	const yabaiOutput = await getYabaiOutput(yabaiProcess);
	await this.refreshWindowsData();
	return yabaiOutput;
}
