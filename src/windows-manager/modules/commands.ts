import { execa } from 'execa';
import { parse } from 'shell-quote';

import { getConfig } from '~/utils/config.js';
import { useDefineMethods } from '~/utils/modules.js';
import { getYabaiOutput } from '~/utils/yabai.js';

export function commandsModule() {
	const defineMethods = useDefineMethods();

	return defineMethods({
		async executeYabaiCommand(command: string) {
			const { yabaiPath } = getConfig();
			const yabaiProcess = execa(yabaiPath, parse(command) as string[]);
			const yabaiOutput = await getYabaiOutput(yabaiProcess);
			await this.refreshWindowsData();
			return yabaiOutput;
		},
	});
}
